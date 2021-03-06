import os.path
import logging
_logger = logging.getLogger(__name__)
from operator import itemgetter

from tornado.web import Application, RequestHandler, StaticFileHandler
from tornado.ioloop import IOLoop
import jinja2

config = {
    'DEBUG': True,
    'PORT' : 5000
}

EXAMPLES_DIR = os.path.split(__file__)[0]
ROOT_DIR = os.path.abspath(os.path.join(EXAMPLES_DIR, os.path.pardir))

GFXTABLET_DIR = os.path.join(ROOT_DIR, "GfxTablet")
import sys
sys.path.insert(0, GFXTABLET_DIR)
from GfxTablet import GfxTabletHandler


env = jinja2.Environment(loader=jinja2.FileSystemLoader(EXAMPLES_DIR))
template = env.get_template('template.html')


class BasicExampleHandler(RequestHandler):
    def get(self):
        # i prefer templating with jinja for now...
        #self.render("template.html", overlay_html="", main_script="/examples/webvrDesk.js")
        self.write(template.render(overlay_html="", main_script="/examples/webvrDesk.js"))

def main():
    handlers = [(r'/gfxtablet', GfxTabletHandler),
                (r'/(.+)', StaticFileHandler, {'path': ROOT_DIR}),
                (r'/', BasicExampleHandler)]
    app = Application(handlers,
                      debug=config.get('DEBUG', False),
                      static_path=ROOT_DIR,
                      autoescape=None)
    _logger.info("app.settings:\n%s" % '\n'.join(['%s: %s' % (k, str(v))
                                                  for k, v in sorted(app.settings.items(),
                                                                     key=itemgetter(0))]))
    port = config.get('PORT', 5000)
    app.listen(port)
    _logger.info("""

listening on port %d
press CTRL-c to terminate the server


             -----------
          Y  A  W  V  R  B
      *************************
  *********************************
  STARTING TORNADO APP!!!!!!!!!!!!!
  *********************************
      *************************
           Y  A  W  V  R  B
             -----------
""" % port)
    IOLoop.instance().start()



if __name__ == "__main__":
    logging.basicConfig(level=(logging.DEBUG if config.get('DEBUG') else logging.INFO),
                        format="%(asctime)s: %(levelname)s %(name)s %(funcName)s %(lineno)d:  %(message)s")
    main()
