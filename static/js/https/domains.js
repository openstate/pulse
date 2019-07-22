$(document).ready(function () {

  $.get("/data/domains/https.json", function(data) {
    renderTable(data.data);
  });

  /**
  * I don't like this at all, but to keep the presentation synced
  * between the front-end table, and the CSV we generate, this is
  * getting replicated to the /data/update script in this repository,
  * and needs to be manually synced.
  *
  * The refactor that takes away from DataTables should also prioritize
  * a cleaner way to DRY (don't repeat yourself) this mess up.
  */

  var names = {
    uses: {
      "-1": "Nee",
      0: "Nee",  // Downgrades HTTPS -> HTTP
      1: "Ja", // (with certificate chain issues)
      2: "Ja"
    },

    enforces: {
      0: "", // N/A (no HTTPS)
      1: "Nee", // Present, not default
      2: "Ja", // Defaults eventually to HTTPS
      3: "Ja" // Defaults eventually + redirects immediately
    },

    hsts: {
      "-1": "", // N/A
      0: "Nee",  // No
      1: "Nee", // No, HSTS with short max-age (for canonical endpoint)
      2: "Ja" // Yes, HSTS for >= 1 year (for canonical endpoint)
    },

    preloaded: {
      0: "",  // No (don't display, since it's optional)
      1: "Gereed",  // Preload-ready
      2: "Ja"  // Yes
    },

    grade: {
      "-1": "",
      0: "F",
      1: "T",
      2: "C",
      3: "B",
      4: "A-",
      5: "A",
      6: "A+"
    }
  };

  var display = function(set) {
    return function(data, type, row) {
      if (type == "sort")
        return data.toString();
      else
        return set[data.toString()];
    }
  };

  var linkGrade = function(data, type, row) {
    var grade = display(names.grade)(data, type);
    if (type == "sort")
      return grade;
    else if (grade == "")
      return ""
    else
      return "" +
        "<a href=\"" + labsUrlFor(row.canonical) + "\" target=\"blank\">" +
          grade +
        "</a>";
  };

  var labsUrlFor = function(domain) {
    return "https://www.ssllabs.com/ssltest/analyze.html?d=" + domain;
  };


  // Construct a sentence explaining the HTTP situation.
  var httpDetails = function(data, type, row) {

    if (type == "sort")
      return null;

    var https = row.https.uses;
    var behavior = row.https.enforces;
    var hsts = row.https.hsts;
    var hsts_age = row.https.hsts_age;
    var preloaded = row.https.preloaded;
    var grade = row.https.grade;

    var tls = [];

    // If an SSL Labs grade exists at all...
    if (row.https.grade >= 0) {

      if (row.https.sig == "SHA1withRSA")
        tls.push("Certificaat gebruikt een " + l("sha1", "zwakke SHA-1 signature"));

      if (row.https.ssl3 == true)
        tls.push("Ondersteunt het " + l("ssl3", "onveilige SSLv3 protocol"));

      if (row.https.tls12 == false)
        tls.push("Geen ondersteuning voor de " + l("tls12", "meest recente versie van TLS"));
    }

    // Though not found through SSL Labs, this is a TLS issue.
    if (https == 1)
      tls.push("Certificate chain niet geldig voor alle publieke clients. Bekijk " + l(labsUrlFor(row.canonical), "SSL Labs") + " voor details.");

    // Non-urgent TLS details.
    var tlsDetails = "";
    if (grade >= 0) {
      if (tls.length > 0)
        tlsDetails += tls.join(". ") + ".";
      else if (grade < 6)
        tlsDetails += l(labsUrlFor(row.canonical), "Bekijk SSL Labs rapport") + " om TLS kwaliteitsproblemen op te lossen.";
    }

    // Principles of message crafting:
    //
    // * Only grant "perfect score!" if TLS quality issues are gone.
    // * Don't show TLS quality issues when pushing to preload.
    // * All flagged TLS quality issues should be reflected in the
    //   SSL Labs grade, so that agencies have fair warning of issues
    //   even before we show them.
    // * Don't speak explicitly about M-15-13, since not all domains
    //   are subject to OMB requirements.

    var details;
    // By default, if it's an F grade, *always* give TLS details.
    var urgent = (grade == 0);

    // CASE: Perfect score!
    if (
        (https >= 1) && (behavior >= 2) &&
        (hsts == 2) && (preloaded == 2) &&
        (tls.length == 0) && (grade == 6))
      details = g("Perfecte score! HTTPS wordt strikt afgedwongen in de hele zone.");

    // CASE: Only issue is TLS quality issues.
    else if (
        (https >= 1) && (behavior >= 2) &&
        (hsts == 2) && (preloaded == 2)) {
      details = g("Bijna perfect!") + " " + tlsDetails;
      // Override F grade override.
      urgent = false;
    }

    // CASE: HSTS preloaded, but HSTS header is missing.
    else if (
        (https >= 1) && (behavior >= 2) &&
        (hsts < 1) && (preloaded == 2))
      details = n("Let op:") + " Domein is gepreload, maar HSTS header ontbreekt. Hierdoor " + l("stay_preloaded", "kan het preloaden van het domein ongedaan gemaakt worden") + ".";

    // CASE: HTTPS+HSTS, preload-ready but not preloaded.
    else if (
        (https >= 1) && (behavior >= 2) &&
        (hsts == 2) && (preloaded == 1))
      details = g("Bijna! ") + "Domein is gereed om " + l("submit", "toe te voegen aan de HSTS preload lijst") + ".";

    // CASE: HTTPS+HSTS (M-15-13 compliant), but no preloading.
    else if (
        (https >= 1) && (behavior >= 2) &&
        (hsts == 2) && (preloaded == 0))
      details = g("HTTPS afgedwongen. ") + n("Overweeg dit domein te preloaden") + " om HTTPS over het gehele zone af te dwingen.";

    // CASE: HSTS, but HTTPS not enforced.
    else if ((https >= 1) && (behavior < 2) && (hsts == 2))
      details = n("Let op:") + " Domein gebruikt " + l("hsts", "HSTS") + ", maar redirect clients niet naar HTTPS.";

    // CASE: HTTPS w/valid chain supported and enforced, weak/no HSTS.
    else if ((https == 2) && (behavior >= 2) && (hsts < 2)) {
      if (hsts == 0)
        details = n("Bijna:") + " Schakel " + l("hsts", "HSTS") + " in zodat clients HTTPS kunnen afdwingen.";
      else if (hsts == 1)
        details = n("Bijna:") + " De " + l("hsts", "HSTS") + " max-age (" + hsts_age + " seconden) is te kort, en moet worden verhoogd tot ten minste 1 jaar (31536000 seconden).";
    }

    // CASE: HTTPS w/invalid chain supported and enforced, no HSTS.
    else if ((https == 1) && (behavior >= 2) && (hsts < 2))
      details = n("Bijna: ") + l("hsts", "HSTS") + " ontbreekt op het domein, maar de certificate chain kan niet geldig zijn voor alle publieke clients. HSTS verhindert dat gebruikers certificaatwaarschuwingen wegklikken. Bekijk " + l(labsUrlFor(row.canonical), "het SSL Labs rapport") + " voor details.";

    // CASE: HTTPS supported, not enforced, no HSTS.
    else if ((https >= 1) && (behavior < 2) && (hsts < 2))
      details = "HTTPS ondersteund, maar niet afgedwongen.";

    // CASE: HTTPS downgrades.
    else if (https == 0)
      details = "HTTPS redirect bezoekers terug naar HTTP."

    // CASE: HTTPS isn't supported at all.
    else if (https == -1)
      // TODO SUBCASE: It's a "redirect domain".
      // SUBCASE: Everything else.
      details = " Geen HTTPS ondersteuning."

    else
      details = "";

    // If there's an F grade, and TLS details weren't already included,
    // add an urgent warning.
    if (urgent)
      return details + " " + w("Waarschuwing: ") + l(labsUrlFor(row.canonical), "bekijk SSL Labs rapport") + " om TLS kwaliteitsproblemen op te lossen."
    else
      return details;
  };

  var links = {
    hsts: "https://www.ncsc.nl/documenten/factsheets/2019/juni/01/factsheet-https-kan-een-stuk-veiliger",
    sha1: "https://www.ncsc.nl/documenten/factsheets/2019/juni/01/factsheet-https-kan-een-stuk-veiliger",
    ssl3: "https://www.ncsc.nl/documenten/publicaties/2019/mei/01/ict-beveiligingsrichtlijnen-voor-transport-layer-security-tls",
    tls12: "https://www.ncsc.nl/documenten/publicaties/2019/mei/01/ict-beveiligingsrichtlijnen-voor-transport-layer-security-tls",
    preload: "https://www.ncsc.nl/",
    stay_preloaded: "https://hstspreload.appspot.com/#continued-requirements",
    submit: "https://hstspreload.appspot.com"
  };

  var l = function(slug, text) {
    return "<a href=\"" + (links[slug] || slug) + "\" target=\"blank\">" + text + "</a>";
  };

  var g = function(text) {
    return "<strong class=\"success\">" + text + "</strong>";
  };

  var w = function(text) {
    return "<strong class=\"warning\">" + text + "</strong>";
  };

  var n = function(text) {
    return "<strong class=\"neutral\">" + text + "</strong>";
  }

  var renderTable = function(data) {
    var table = $("table").DataTable({

      data: data,

      responsive: {
          details: {
              type: "",
              display: $.fn.dataTable.Responsive.display.childRowImmediate
          }
      },

      initComplete: Utils.searchLinks,

      columns: [
        {
          data: "domain",
          width: "210px",
          cellType: "th",
          render: Utils.linkDomain
        },
        {data: "canonical"},
        {data: "agency_name"},
        {
          data: "https.uses",
          render: display(names.uses)
        },
        {
          data: "https.enforces",
          render: display(names.enforces)
        },
        {
          data: "https.hsts",
          render: display(names.hsts)
        },
        {
          data: "https.preloaded",
          render: display(names.preloaded)
        },
        {
          data: "https.grade",
          render: linkGrade
        },
        {
          data: "",
          render: httpDetails
        }
      ],

      columnDefs: [
        {
          targets: 0,
          cellType: "td",
          createdCell: function (td) {
            td.scope = "row";
          }
        }
      ],

      "oLanguage": {
        "oPaginate": {
          "sPrevious": "<<",
          "sNext": ">>"
        },
        "sInfo": "_START_ tot _END_ van _TOTAL_ domeinen",
        "sInfoEmpty": "Geen domeinen beschikbaar",
        "sInfoThousands": ".",
        "sLengthMenu": 'Toon _MENU_ domeinen',
        "sSearch": "Zoeken:"
      },

      csv: "/data/domains/https.csv",

      dom: 'LCftrip'

    });

  }

})
