"""Receives Android tablet input data transmitted via UDP
by the GfxTablet Android app and pushes it to WebSocket client.

GfxTablet: https://github.com/rfc2822/GfxTablet
"""

import logging
import socket
from tornado.websocket import WebSocketHandler
from tornado.ioloop import IOLoop

_logger = logging.getLogger(__name__)

udpsock = socket.socket(type=socket.SOCK_DGRAM)
udpsock.bind(('0.0.0.0', 40118))
udpsock.setblocking(False)

class GfxTabletHandler(WebSocketHandler):
    EVENT_TYPE_MOTION = 0
    EVENT_TYPE_BUTTON = 1
    # see http://www.bbarrows.com/blog/2013/01/27/udptornado/
    def initialize(self):
        self._buf = bytearray(20*10)
        # TODO: maybe not robust on all platforms (see http://stackoverflow.com/questions/166506/finding-local-ip-addresses-using-pythons-stdlib)
        _logger.info("in GfxTablet settings, set the recipient host to %s (this server's local IP address)" % socket.gethostbyname(socket.gethostname()))
    def open(self):
        _logger.debug("GfxTablet WebSocket opened")
        self.set_nodelay(True) # maybe better to not do this?
        ioloop = IOLoop.current()
        ioloop.add_handler(udpsock.fileno(), self.handle_input, ioloop.READ)
    def on_message(self, message):
        _logger.debug(message)
    def on_close(self):
        _logger.debug("GfxTablet WebSocket closed")
        ioloop = IOLoop.current()
        ioloop.remove_handler(udpsock.fileno())
    def handle_input(self, fd, events):
        # TODO: android app sends width, height, use it
        buf = self._buf
        nbytes = udpsock.recv_into(buf)
        event_type = buf[11]
        x = (256 * buf[12] + buf[12 + 1]) / 2.0**16
        y = (256 * buf[14] + buf[14 + 1]) / 2.0**16
        p = (256 * buf[16] + buf[16 + 1]) / 2.0**15
        if event_type == GfxTabletHandler.EVENT_TYPE_MOTION:
            self.write_message({'x': x, 'y': y, 'p': p})
        elif event_type == GfxTabletHandler.EVENT_TYPE_BUTTON:
            # TODO: galaxy note 10.1 stylus button not working?
            # if buf[18] != 255:
            #     _logger.debug("button: %d  down: %d" % (buf[18], buf[19]))
            self.write_message({'x': x, 'y': y, 'p': p, 'button': buf[18], 'down': buf[19]})
