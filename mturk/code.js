<!-- Replace the value for tatoolLink with your Tatool Web URL (without the extid) -->
<script type="text/javascript" language="JavaScript">
  var tatoolLink = "http://www.tatool-web.com/#/public/xxxxx";
</script>


<!-- No changes needed below this line -->
<div id="linkElement">
  <b>To perform this HIT, you must have Javascript and cookies enabled.</b>
</div>

<script type="text/javascript" language="JavaScript">
<!--
  var linkElement = document.getElementById('linkElement');
  var queryString = window.location.search.substring(1);
  var queryPairs = queryString.split("&");
  var workerId = "";
  for (i in queryPairs) {
    var pair = queryPairs[i].split("=");
    if (pair[0] == "workerId")
      workerId = pair[1];
  }

  if (workerId == "" ) {
    linkElement.innerHTML = '<b>The link will be displayed once the HIT has been accepted.</b>';
  } else {
    linkElement.innerHTML = '<a target="_blank" href="' + tatoolLink + '?extid=' + workerId + '"><h2><b>Start Experiment!</b></h2></a>';
  }

// -->
</script>