<!DOCTYPE html>
<html>
 <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
</head>
<body>
<script type="text/javascript">
	// Set up the application directory name 
	var app = "Roadkill"; //"csr";
	// Add url name/value pairs
	var name_value = "?app="+app;
	name_value += document.location.search[0] === "?" ? "&"+ document.location.search.substr(1) : "";
	location.href = "../index.html"+name_value;
</script>
</body>
</html>