
from flask import render_template, Response
from app import models, models_zorg, models_onderwijs
from app.data import FIELD_MAPPING
import ujson

def register(app):

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/about/")
    def about():
        return render_template("about.html")

    ##
    # Data endpoints.

    # High-level %'s, used to power the donuts.
    @app.route("/data/reports/<report_name>.json")
    def report(report_name):
        response = Response(ujson.dumps(models.Report.latest().get(report_name, {})))
        response.headers['Content-Type'] = 'application/json'
        return response
    @app.route("/data-zorg/reports/<report_name>.json")
    def report_zorg(report_name):
        response = Response(ujson.dumps(models_zorg.Report.latest().get(report_name, {})))
        response.headers['Content-Type'] = 'application/json'
        return response
    @app.route("/data-onderwijs/reports/<report_name>.json")
    def report_onderwijs(report_name):
        response = Response(ujson.dumps(models_onderwijs.Report.latest().get(report_name, {})))
        response.headers['Content-Type'] = 'application/json'
        return response

    # Detailed data per-domain, used to power the data tables.
    @app.route("/data/domains/<report_name>.<ext>")
    def domain_report(report_name, ext):
        domains = models.Domain.eligible(report_name)
        domains = sorted(domains, key=lambda k: k['domain'])

        if ext == "json":
          response = Response(ujson.dumps({'data': domains}))
          response.headers['Content-Type'] = 'application/json'
        elif ext == "csv":
          response = Response(models.Domain.to_csv(domains, report_name))
          response.headers['Content-Type'] = 'text/csv'
        return response
    @app.route("/data-zorg/domains/<report_name>.<ext>")
    def domain_report_zorg(report_name, ext):
        domains = models_zorg.Domain.eligible(report_name)
        domains = sorted(domains, key=lambda k: k['domain'])

        if ext == "json":
          response = Response(ujson.dumps({'data': domains}))
          response.headers['Content-Type'] = 'application/json'
        elif ext == "csv":
          response = Response(models_zorg.Domain.to_csv(domains, report_name))
          response.headers['Content-Type'] = 'text/csv'
        return response
    @app.route("/data-onderwijs/domains/<report_name>.<ext>")
    def domain_report_onderwijs(report_name, ext):
        domains = models_onderwijs.Domain.eligible(report_name)
        domains = sorted(domains, key=lambda k: k['domain'])

        if ext == "json":
          response = Response(ujson.dumps({'data': domains}))
          response.headers['Content-Type'] = 'application/json'
        elif ext == "csv":
          response = Response(models_onderwijs.Domain.to_csv(domains, report_name))
          response.headers['Content-Type'] = 'text/csv'
        return response

    @app.route("/data/agencies/<report_name>.json")
    def agency_report(report_name):
        domains = models.Agency.eligible(report_name)
        response = Response(ujson.dumps({'data': domains}))
        response.headers['Content-Type'] = 'application/json'
        return response
    #@app.route("/data-zorg/agencies/<report_name>.json")
    #def agency_report_zorg(report_name):
    #    domains = models_zorg.Agency.eligible(report_name)
    #    response = Response(ujson.dumps({'data': domains}))
    #    response.headers['Content-Type'] = 'application/json'
    #    return response
    @app.route("/data-onderwijs/agencies/<report_name>.json")
    def agency_report_onderwijs(report_name):
        domains = models_onderwijs.Agency.eligible(report_name)
        response = Response(ujson.dumps({'data': domains}))
        response.headers['Content-Type'] = 'application/json'
        return response

    @app.route("/https/domains/")
    def https_domains():
        return render_template("https/domains.html")
    @app.route("/https-zorg/domains/")
    def https_domains_zorg():
        return render_template("https-zorg/domains.html")
    @app.route("/https-onderwijs/domains/")
    def https_domains_onderwijs():
        return render_template("https-onderwijs/domains.html")

    @app.route("/https/agencies/")
    def https_agencies():
        return render_template("https/agencies.html")
    #@app.route("/https-zorg/agencies/")
    #def https_agencies_zorg():
    #    return render_template("https-zorg/agencies.html")
    @app.route("/https-onderwijs/agencies/")
    def https_agencies_onderwijs():
        return render_template("https-onderwijs/agencies.html")

    @app.route("/https/guidance/")
    def https_guide():
        return render_template("https/guide.html")
    @app.route("/https-zorg/guidance/")
    def https_guide_zorg():
        return render_template("https-zorg/guide.html")
    @app.route("/https-onderwijs/guidance/")
    def https_guide_onderwijs():
        return render_template("https-onderwijs/guide.html")

    #@app.route("/analytics/domains/")
    #def analytics_domains():
    #    return render_template("analytics/domains.html")

    #@app.route("/analytics/agencies/")
    #def analytics_agencies():
    #    return render_template("analytics/agencies.html")

    #@app.route("/analytics/guidance/")
    #def analytics_guide():
    #    return render_template("analytics/guide.html")

    @app.route("/agency/<slug>")
    def agency(slug=None):
        agency = models.Agency.find(slug)
        if agency is None:
            pass # TODO: 404

        return render_template("agency.html", agency=agency)
    #@app.route("/agency-zorg/<slug>")
    #def agency_zorg(slug=None):
    #    agency = models_zorg.Agency.find(slug)
    #    if agency is None:
    #        pass # TODO: 404
    @app.route("/agency-onderwijs/<slug>")
    def agency_onderwijs(slug=None):
        agency = models_onderwijs.Agency.find(slug)
        if agency is None:
            pass # TODO: 404

        return render_template("agency.html", agency=agency)

    @app.route("/domain/<hostname>")
    def domain(hostname=None):
        domain = models.Domain.find(hostname)
        if domain is None:
            pass # TODO: 404

        return render_template("domain.html", domain=domain)
    @app.route("/domain-zorg/<hostname>")
    def domain_zorg(hostname=None):
        domain = models_zorg.Domain.find(hostname)
        if domain is None:
            pass # TODO: 404

        return render_template("domain.html", domain=domain)
    @app.route("/domain-onderwijs/<hostname>")
    def domain_onderwijs(hostname=None):
        domain = models_onderwijs.Domain.find(hostname)
        if domain is None:
            pass # TODO: 404

        return render_template("domain.html", domain=domain)

    #@app.route("/accessibility/domain/<hostname>")
    #def a11ydomain(hostname=None):
    #  return render_template("a11y.html", domain=hostname)

    # Sanity-check RSS feed, shows the latest report.
    @app.route("/data/reports/feed/")
    def report_feed():
        return render_template("feed.xml")

    #@app.route("/accessibility/domains/")
    #def accessibility_domains():
    #  return render_template("accessibility/domains.html")

    #@app.route("/accessibility/agencies/")
    #def accessibility_agencies():
    #  return render_template("accessibility/agencies.html")

    #@app.route("/accessibility/guidance/")
    #def accessibility_guide():
    #  return render_template("accessibility/guide.html")

    @app.errorhandler(404)
    def page_not_found(e):
      return render_template('404.html'), 404
