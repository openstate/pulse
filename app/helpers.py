import yaml
import datetime
from app import models, models_zorg, models_onderwijs
from app.data import FIELD_MAPPING

# For use in templates.
def register(app):

  ###
  # Context processors and filters.

  def scan_date():
    return models.Report.report_time(models.Report.latest()['report_date'])

  def scan_date_zorg():
    return models_zorg.Report.report_time(models_zorg.Report.latest()['report_date'])

  def scan_date_onderwijs():
    return models_onderwijs.Report.report_time(models_onderwijs.Report.latest()['report_date'])

  def overheid_aantal():
    return models.Report.latest()['https']['eligible']

  def zorg_aantal():
    return models_zorg.Report.latest()['https']['eligible']

  def onderwijs_aantal():
    return models_onderwijs.Report.latest()['https']['eligible']

  # Make site metadata available everywhere.
  meta = yaml.safe_load(open("meta.yml"))
  @app.context_processor
  def inject_meta():
      return dict(site=meta, now=datetime.datetime.utcnow, scan_date=scan_date(), scan_date_zorg=scan_date_zorg(), scan_date_onderwijs=scan_date_onderwijs(), overheid_aantal=overheid_aantal(), zorg_aantal=zorg_aantal(), onderwijs_aantal=onderwijs_aantal())

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
