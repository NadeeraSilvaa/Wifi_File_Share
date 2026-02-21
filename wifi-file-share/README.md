# WiFi File Share

**WiFi File Share** is a simple web app that lets you share files over your local Wi‑Fi with any device on the same network—phones, tablets, and computers—without accounts or cloud storage. One device runs the server; everyone else opens a link in their browser to upload and download files.

**Useful for developers and everyone:** push builds or assets to your phone, move screenshots from your Mac to Windows, send a PDF from your iPhone to an Android tablet—any device with a web browser (Android, Mac, iPhone, Windows, Linux, iPad) can join. No app install, no sign‑up, no cloud.

---

## What it does

- **Share files on the same Wi‑Fi** — Run the app on one machine (e.g. your laptop). Any device connected to the same network can open the page and exchange files.
- **Upload** — Drag and drop files on desktop, or use “Add files” on any device (including phones).
- **Download** — Files are listed with a Download button. PDFs and other types are forced to download instead of opening in the browser.
- **See who uploaded what** — Each file shows which device uploaded it. You can give your device a name (e.g. “Nadeera’s iPhone”) so it’s easy to recognise.
- **Open on other devices** — The page shows the exact URL to use on phones/other PCs and a **QR code** you can scan to open the same page on your phone.
- **No internet required** — Everything stays on your local network.

---

## Quick start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the server**

   ```bash
   npm start
   ```

3. **Open the app**

   - On this computer: open **http://localhost:8080** in your browser.
   - On other devices: use the URL printed in the terminal (e.g. `http://192.168.1.100:8080`) or scan the QR code shown on the page.

---

## How to use

### On the computer running the server

- Open **http://localhost:8080** (or the URL shown in the terminal).
- You’ll see the drop zone, the “Open on other devices” URL, the QR code, and the list of shared files.

### On other devices (phone, tablet, another PC)

1. Make sure the device is on the **same Wi‑Fi** as the computer running the server.
2. On the server machine, look at the **“Open on other devices”** section:
   - **Option A:** Type the URL (e.g. `http://192.168.1.100:8080`) into the browser on the other device.
   - **Option B:** Use the **Copy** button and send the link to the other device (e.g. by message or email), then open it there.
   - **Option C:** **Scan the QR code** with your phone’s camera to open the page directly.
3. On the opened page you can:
   - **Upload:** Tap “Add files” (or drag and drop on a computer) and choose files.
   - **Download:** Tap a file name or the “Download” button to save the file.
   - **Delete:** Use “Delete” next to a file to remove it (anyone who can open the page can delete).

### Naming your device

- Under the drop zone you’ll see **“Uploading as: Device x7f3a”** (or a name if you’ve set one).
- Click **“Name this device”** to set a friendly name (e.g. “Nadeera’s iPhone”). This name is stored only in your browser and is shown next to files you upload so you can tell which device added them.

### File list and refresh

- The list shows all shared files with **name**, **size**, **uploading device**, **Download**, and **Delete**.
- The list **refreshes automatically every 2 minutes** so new files from other devices appear without reloading the page.

---

## Firewall

If other devices cannot open the URL:

- **Windows:** When you first run the server, allow Node/Node.js through the firewall for **Private** networks, or add an inbound rule for **TCP port 8080**.
- **Mac:** In **System Settings → Network → Firewall → Options**, allow incoming connections for “node” (or your terminal) on private networks.

The app listens on all interfaces (`0.0.0.0`) so it can be reached via your computer’s local IP. It is **not** exposed to the internet unless you deliberately forward the port (not recommended).

---

## Optional settings

- **Different port:** If port 8080 is in use, run:  
  `PORT=4000 npm start`  
  Then use `http://<your-ip>:4000` on other devices.
- **Removing files:** Use the “Delete” button next to a file in the list. Only files are removed; device names and IDs in the list stay as they were at upload time.

---

## Project layout

| Path | Description |
|------|-------------|
| `server.js` | Express server: serves the web UI, file list, upload, download, delete, and device metadata. |
| `public/` | Single-page app: `index.html`, `style.css`, `app.js` (drag‑drop, file list, QR code, device name). |
| `shared-files/` | Folder where uploaded files are stored (created on first run). |
| `shared-files/.meta.json` | Stores which device uploaded each file (device id, name, time). Not shown in the file list. |

---

## Summary

Use **WiFi File Share** when you want to move files between your own devices on the same Wi‑Fi quickly, without signing in or using the cloud. Start the server on one machine, open the given URL (or scan the QR code) on your phone or other computers, and add or download files as needed.
