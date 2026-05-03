use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;

#[derive(Default)]
struct AppState {
    // We no longer need to track a pocketbase process
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Profile {
    id: String,
    shop_name: String,
    shop_phone: String,
    shop_address: String,
    admin_email: String,
    created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct ProfileRegistry {
    active_profile_id: Option<String>,
    profiles: Vec<Profile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateProfileRequest {
    shop_name: String,
    shop_phone: String,
    shop_address: String,
    password: String,
}

fn slugify(input: &str) -> String {
    let mut out = String::new();
    let mut prev_dash = false;

    for c in input.chars() {
        if c.is_ascii_alphanumeric() {
            out.push(c.to_ascii_lowercase());
            prev_dash = false;
        } else if !prev_dash {
            out.push('-');
            prev_dash = true;
        }
    }

    let trimmed = out.trim_matches('-');
    if trimmed.is_empty() {
        "shop".to_string()
    } else {
        trimmed.to_string()
    }
}

fn now_ts() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn app_profiles_root(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("failed to resolve app data dir: {e}"))?;
    Ok(app_data.join("profiles"))
}

fn registry_file_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app_profiles_root(app_handle)?.join("registry.json"))
}

fn load_registry(app_handle: &tauri::AppHandle) -> Result<ProfileRegistry, String> {
    let path = registry_file_path(app_handle)?;
    if !path.exists() {
        return Ok(ProfileRegistry::default());
    }

    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("failed to read profile registry {:?}: {e}", path))?;
    serde_json::from_str(&raw).map_err(|e| format!("failed to parse profile registry: {e}"))
}

fn save_registry(app_handle: &tauri::AppHandle, registry: &ProfileRegistry) -> Result<(), String> {
    let root = app_profiles_root(app_handle)?;
    fs::create_dir_all(&root)
        .map_err(|e| format!("failed to create profiles directory {:?}: {e}", root))?;

    let path = registry_file_path(app_handle)?;
    let json = serde_json::to_string_pretty(registry)
        .map_err(|e| format!("failed to serialize profile registry: {e}"))?;

    fs::write(&path, json)
        .map_err(|e| format!("failed to write profile registry {:?}: {e}", path))
}

#[tauri::command]
fn list_profiles(app_handle: tauri::AppHandle) -> Result<Vec<Profile>, String> {
    let registry = load_registry(&app_handle)?;
    Ok(registry.profiles)
}

#[tauri::command]
fn get_active_profile(app_handle: tauri::AppHandle) -> Result<Option<Profile>, String> {
    let registry = load_registry(&app_handle)?;
    let Some(active_id) = registry.active_profile_id else {
        return Ok(None);
    };

    Ok(registry
        .profiles
        .into_iter()
        .find(|p| p.id == active_id))
}

#[tauri::command]
fn switch_profile(app_handle: tauri::AppHandle, profile_id: String) -> Result<Profile, String> {
    let mut registry = load_registry(&app_handle)?;
    let profile = registry
        .profiles
        .iter()
        .find(|p| p.id == profile_id)
        .cloned()
        .ok_or_else(|| format!("profile not found: {profile_id}"))?;

    registry.active_profile_id = Some(profile.id.clone());
    save_registry(&app_handle, &registry)?;

    Ok(profile)
}

#[tauri::command]
fn create_profile(app_handle: tauri::AppHandle, input: CreateProfileRequest) -> Result<Profile, String> {
    if input.shop_name.trim().is_empty() {
        return Err("shop name is required".to_string());
    }
    if input.password.len() < 8 {
        return Err("password must be at least 8 characters".to_string());
    }

    let mut registry = load_registry(&app_handle)?;

    let base = slugify(&input.shop_name);
    let profile_id = format!("{}-{}", base, now_ts());
    let admin_email = format!("{}@local.finopenpos", profile_id);

    let profile = Profile {
        id: profile_id,
        shop_name: input.shop_name,
        shop_phone: input.shop_phone,
        shop_address: input.shop_address,
        admin_email,
        created_at: now_ts(),
    };

    registry.profiles.push(profile.clone());
    registry.active_profile_id = Some(profile.id.clone());
    save_registry(&app_handle, &registry)?;

    Ok(profile)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            list_profiles,
            get_active_profile,
            switch_profile,
            create_profile
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
