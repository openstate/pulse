import yaml
import datetime
import os
from app import models
from app.data import FIELD_MAPPING

# For use in templates.
def register(app):

  ###
  # Context processors and filters.

  def scan_date():
    return models.Report.report_time(models.Report.latest()['report_date'])

  # Is the site in frozen mode?
  frozen = (os.getenv("FROZEN", "False") == "True")

  # If the site is in frozen mode, use the frozen URL.
  @app.template_filter('frozen_url')
  def frozen_url(url):
    if frozen:
      return "/static/frozen%s" % url
    else:
      return url

  # Tiny helper to embed the frozen mode into JS.
  @app.template_filter('js_bool')
  def js_bool(value):
    return str(value).lower()

  # Make site metadata available everywhere.
  meta = yaml.safe_load(open("meta.yml"))
  @app.context_processor
  def inject_meta():
      if frozen:
        last_scan_date = models.Report.report_time(meta["frozen"]["scan_date"])
      else:
        last_scan_date = scan_date()
      return dict(site=meta, frozen=frozen, now=datetime.datetime.utcnow, scan_date=last_scan_date)

  @app.template_filter('date')
  def datetimeformat(value, format='%H:%M / %d-%m-%Y'):
      return value.strftime(format)

  @app.template_filter('field_map')
  def field_map(value, category=None, field=None):
      return FIELD_MAPPING[category][field][value]

  @app.template_filter('percent')
  def percent(num, denom):
      return round((num / denom) * 100)

  @app.template_filter('percent_not')
  def percent_not(num, denom):
      return (100 - round((num / denom) * 100))
