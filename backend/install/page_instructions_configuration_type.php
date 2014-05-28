<?php

	/**
	 * page_instructions_configuration_type.php
	 *
	 * Copyright 2008- Samuli J�rvel�
	 * Released under GPL License.
	 *
	 * License: http://www.mollify.org/license.php
	 */
	 
	include("installation_page.php");
	global $CONFIGURATION;
?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<html>
	<?php pageHeader("Cloudberry Installation", "init"); ?>
	
	<?php pageBody("Welcome to Cloudberry installation"); ?>
	
	<?php if (isset($CONFIGURATION["db"]) && isset($CONFIGURATION["db"]["type"])) { ?>
		<p>
			<div class="bs-callout bs-callout-danger">
				<h4>Database configuration is not valid.</h4>
				<p>
					Database type "<code><?php echo($CONFIGURATION["db"]["type"]); ?></code>" is invalid. For more information, see <a href="https://github.com/sjarvela/cloudberry/wiki/Installation-instructions" target="_blank">installation instructions</a>.
				</p>
			</div>
		</p>
	<?php } ?>
		
	<?php if (!isset($CONFIGURATION) || !isset($CONFIGURATION["db"]) || !isset($CONFIGURATION["db"]["type"])) { ?>
	<p>
		To continue with Cloudberry installation, you have to setup the configuration.
	</p>
	<?php } ?>

	<p>
		Edit the configuration file <code>configuration.php</code> by adding the database type, for example:
		<pre>&lt;?php
	$CONFIGURATION = array(
		&quot;db&quot; => array(
			&quot;type&quot; => &quot;<span class="value">[DATABASE TYPE]</span>&quot;
		)
	);
?&gt;</pre>
	</p>
	<p>
		Possible values are:
		<ul>
			<li>"<code>mysql</code>" for MySQL</li>
			<li>"<code>sqlite</code>" for SQLite</li>
			<li>"<code>sqlite3</code>" for SQLite 3</li>
			<li>"<code>pdo</code>" for PDO (supports MySQL and SQLite)</li>
		</ul>
		
		When this is added, click "Continue". For more information about the installation, see <a href="https://github.com/sjarvela/cloudberry/wiki/Installation-instructions" target="_blank">installation instructions</a>.

	</p>

	<p>
		<a href="javascript: action('retry')" class="btn btn-success">Continue</a>
	</p>
			
	<?php pageFooter(); ?>
</html>