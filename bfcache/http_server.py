#!/usr/bin/env python3

import http.server
import socketserver
import threading

class HttpRequestHandler(http.server.SimpleHTTPRequestHandler):
  def end_headers(self):
    # self.send_headers()
    http.server.SimpleHTTPRequestHandler.end_headers(self)

  def send_headers(self):
    self.send_header("Service-Worker-Allowed", "/")

handler = HttpRequestHandler

HOST = "localhost"
PORT = 8000
server = socketserver.ThreadingTCPServer((HOST, PORT), handler)

print("Hosting a server at " + HOST + ":" + str(PORT))
with server:
    server_thread = threading.Thread(target=server.serve_forever())
    server_thread.daemon = True
    server_thread.start()

def main():
  pass

if __name__ == '__main__':
  main()
