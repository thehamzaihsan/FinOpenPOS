use serde::{Deserialize, Serialize};
use std::fs;
use std::net::TcpListener;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;

#[derive(Default)]
struct AppState {
    pocketbase_child: Mutex<Option<Child>>,
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

fn is_port_in_use(port: u16) -> bool {
    TcpListener::bind(("127.0.0.1", port)).is_err()
}

fn ensure_global_superuser(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let pb_path = get_pocketbase_path(app_handle);
    if !pb_path.exists() {
        return Err("PocketBase binary not found".to_string());
    }

    let app_data = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("failed to get app data dir: {}", e))?;
    let pb_dir = app_data.join("pb_global");
    fs::create_dir_all(&pb_dir).map_err(|e| format!("failed to create pb_global dir: {}", e))?;

    let output = Command::new(&pb_path)
        .args(&[
            "superuser",
            "upsert",
            "admin@finopenpos.com",
            "FinOpenPOS2024!",
            "--dir",
            &pb_dir.to_string_lossy(),
        ])
        .output()
        .map_err(|e| format!("failed to run superuser upsert: {}", e))?;

    if output.status.success() {
        eprintln!("Global superuser ensured");
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        eprintln!("Superuser upsert warning: {}", stderr);
    }
    Ok(())
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

fn profile_data_dir(app_handle: &tauri::AppHandle, profile_id: &str) -> Result<PathBuf, String> {
    Ok(app_profiles_root(app_handle)?
        .join(profile_id)
        .join("pb_data"))
}

fn get_pocketbase_path(app_handle: &tauri::AppHandle) -> std::path::PathBuf {
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        let pb_path = resource_dir.join("pocketbase");
        if pb_path.exists() {
            return pb_path;
        }
    }
    
    if let Ok(exe_dir) = std::env::current_exe() {
        let pb_path = exe_dir.parent().unwrap().join("pocketbase");
        if pb_path.exists() {
            return pb_path;
        }
    }
    
    let dev_path = std::path::PathBuf::from("pocketbase");
    if dev_path.exists() {
        return dev_path;
    }

    let tauri_dev_path = std::path::PathBuf::from("src-tauri/pocketbase");
    if tauri_dev_path.exists() {
        return tauri_dev_path;
    }
    
    std::path::PathBuf::from("./pocketbase")
}

fn start_pocketbase_for_dir(
    app_handle: &tauri::AppHandle,
    data_dir: &Path,
) -> Result<Child, Box<dyn std::error::Error>> {
    let pb_path = get_pocketbase_path(app_handle);
    eprintln!(
        "Starting PocketBase from: {:?} (data_dir: {:?})",
        pb_path, data_dir
    );
    
    if !pb_path.exists() {
        eprintln!("PocketBase binary NOT FOUND at {:?}", pb_path);
        return Err("PocketBase binary not found".into());
    }

    if let Some(parent) = data_dir.parent() {
        fs::create_dir_all(parent)?;
    }
    
    let child = Command::new(&pb_path)
        .args(&[
            "serve",
            "--http",
            "127.0.0.1:8090",
            "--dir",
            &data_dir.to_string_lossy(),
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;

    eprintln!("PocketBase started with PID {:?}", child.id());
    Ok(child)
}

fn stop_pocketbase(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let state = app_handle.state::<AppState>();
    let mut guard = state
        .pocketbase_child
        .lock()
        .map_err(|_| "failed to lock pocketbase process state".to_string())?;

    if let Some(child) = guard.as_mut() {
        if let Err(e) = child.kill() {
            eprintln!("PocketBase kill failed: {e}");
        }
        if let Err(e) = child.wait() {
            eprintln!("PocketBase wait failed: {e}");
        }
    }

    *guard = None;
    Ok(())
}

fn start_profile(app_handle: &tauri::AppHandle, profile_id: &str) -> Result<(), String> {
    let data_dir = profile_data_dir(app_handle, profile_id)?;

    stop_pocketbase(app_handle)?;

    let child = start_pocketbase_for_dir(app_handle, &data_dir)
        .map_err(|e| format!("failed to start PocketBase for profile {profile_id}: {e}"))?;

    let state = app_handle.state::<AppState>();
    let mut guard = state
        .pocketbase_child
        .lock()
        .map_err(|_| "failed to lock pocketbase process state".to_string())?;
    *guard = Some(child);
    Ok(())
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

    start_profile(&app_handle, &profile.id)?;
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

    let pb_path = get_pocketbase_path(&app_handle);
    if !pb_path.exists() {
        return Err("PocketBase binary not found".to_string());
    }

    let data_dir = profile_data_dir(&app_handle, &profile_id)?;
    if let Some(parent) = data_dir.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("failed to create profile directory {:?}: {e}", parent))?;
    }

    let admin_status = Command::new(&pb_path)
        .args(&[
            "superuser",
            "upsert",
            &admin_email,
            &input.password,
            "--dir",
            &data_dir.to_string_lossy(),
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("failed to run pocketbase superuser upsert: {e}"))?;

    if !admin_status.status.success() {
        let stderr = String::from_utf8_lossy(&admin_status.stderr);
        let stdout = String::from_utf8_lossy(&admin_status.stdout);
        eprintln!("PB superuser upsert failed. stdout: {}, stderr: {}", stdout, stderr);
        return Err(format!("failed to initialize profile admin account: {}", stderr).to_string());
    }

    eprintln!("PB superuser created successfully for {}", admin_email);

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

    start_profile(&app_handle, &profile.id)?;

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
            let app_handle = app.handle().clone();

            eprintln!("Ensuring global superuser...");
            if let Err(e) = ensure_global_superuser(&app_handle) {
                eprintln!("Failed to ensure global superuser: {}", e);
            }

            if is_port_in_use(8090) {
                eprintln!("Port 8090 already in use, skipping PocketBase spawn.");
            } else {
                match load_registry(&app_handle) {
                    Ok(registry) => {
                        if let Some(active_profile_id) = registry.active_profile_id {
                            eprintln!("Starting active profile: {}", active_profile_id);
                            if let Err(e) = start_profile(&app_handle, &active_profile_id) {
                                eprintln!("Failed to start active profile PocketBase: {}", e);
                            }
                        } else if !registry.profiles.is_empty() {
                            let first_id = registry.profiles[0].id.clone();
                            eprintln!("No active profile found, picking first available: {}", first_id);
                            if let Err(e) = start_profile(&app_handle, &first_id) {
                                eprintln!("Failed to start first profile PocketBase: {}", e);
                            } else {
                                // Update registry to make it active
                                let mut updated = registry.clone();
                                updated.active_profile_id = Some(first_id);
                                let _ = save_registry(&app_handle, &updated);
                            }
                        } else {
                            eprintln!("No profiles found in registry, PocketBase will start after creation.");
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed loading profile registry: {e}");
                    }
                }
            }
            
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if let Err(e) = stop_pocketbase(window.app_handle()) {
                    eprintln!("Failed to stop PocketBase on close: {e}");
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
