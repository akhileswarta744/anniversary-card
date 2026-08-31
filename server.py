"""
LOVE-OS v5.0 // Local Network Web Server
Run this script to host the anniversary terminal on your local Wi-Fi.
Both of you can connect from laptops, iPhones, or Android phones!
"""

import http.server
import socket
import socketserver
import webbrowser

PORT = 8080

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

if __name__ == '__main__':
    local_ip = get_local_ip()
    handler = http.server.SimpleHTTPRequestHandler
    handler.extensions_map.update({
        '.js': 'application/javascript',
    })

    print("=" * 60)
    print("  ⚡ LOVE-OS v5.0 // 5TH ANNIVERSARY SERVER RUNNING ⚡")
    print("=" * 60)
    print(f"\n▶ On your PC / Laptop, open:")
    print(f"  http://localhost:{PORT}")
    print(f"\n▶ On HER Phone / Laptop (Connected to the same Wi-Fi), open:")
    print(f"  http://{local_ip}:{PORT}")
    print("\n" + "=" * 60)

    # Open browser on host
    try:
        webbrowser.open(f"http://localhost:{PORT}")
    except Exception:
        pass

    with socketserver.TCPServer(("", PORT), handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped. Happy 5th Anniversary!")
