import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return new Intl.DateTimeFormat('en-US').format(date)
}

export async function downloadFile(url: string, filename?: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to download file");

    const contentType = res.headers.get('Content-Type') || '';
    
    // For HTML content, open in new tab instead of downloading
    if (contentType.includes('text/html')) {
      const html = await res.text();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      } else {
        alert("Popup blocked. Please allow popups for this site to print.");
      }
      return;
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;

    if (filename) {
      link.download = filename;
    } else {
      const contentDisposition = res.headers.get('Content-Disposition');
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          link.download = match[1];
        }
      }
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Download failed:", error);
    alert("Failed to download file. Please try again.");
  }
}