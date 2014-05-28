<?php

	/**
	 * page_configuration.php
	 *
	 * Copyright 2008- Samuli J�rvel�
	 * Released under GPL License.
	 *
	 * License: http://www.mollify.org/license.php
	 */
	 
	 include("install/installation_page.php");
?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<html>
	<?php pageHeader("Cloudberry Installation", "init"); ?>
	
	<?php pageBody("MySQL Database Configuration"); ?>
		
	<?php if ($installer->action() === 'continue' and !$installer->hasError()) { ?>		
	<div class="error">
		<div class="title">	
			No database configuration found.
		</div>
		<div class="details">
			MySQL database configuration is missing or it is not complete. Make sure that the configuration is done according to the instructions below. At minimum, database user and password must be defined.
		</div>
	</div>
	<?php } ?>
		
	<p>
		Installer needs the database connection information defined in the configuration file "<code>configuration.php</code>":
		<ul>
			<li>User</li>
			<li>Password</li>
			<li>Host name (optional, by default "localhost")</li>
			<li>Database name (optional, by default "mollify")</li>
			<li>Port (for remote MySQL servers, optional)</li>
			<li>Socket (for local MySQL servers, optional)</li>
			<li>Table prefix (optional)</li>
			<li>Charset (optional)</li>
		</ul>
		
		For more information, see <a href="https://github.com/sjarvela/cloudberry/wiki/Installation-instructions">Installation instructions</a>.
	</p>
	<p>	
		An example configuration:
		<pre>&lt;?php
$CONFIGURATION = array(
	&quot;db&quot; => array(
		&quot;type&quot; => &quot;mysql&quot;,
		&quot;user&quot; => &quot;<span class="value">[MYSQL_USERNAME]</span>&quot;,
		&quot;password&quot; => &quot;<span class="value">[MYSQL_PASSWORD]</span>&quot;,
		&quot;host&quot; => &quot;<span class="value">localhost</span>&quot;,
		&quot;database&quot; => &quot;<span class="value">mollify</span>&quot;,
		&quot;table_prefix&quot; => &quot;<span class="value">mollify_</span>&quot;,
		&quot;charset&quot; => &quot;<span class="value">utf8</span>&quot;
	)
);
?&gt;</pre>
	</p>
	<p>
		Edit the configuration and click "Continue".
	</p>
	<p>
		<a class="btn btn-success" href="javascript: action('continue');">Continue</a>
	</p>
	
<?php pageFooter(); ?>
</html>