<?php

	/**
	 * page_update.php
	 *
	 * Copyright 2014- Samuli Järvelä
	 * Released under GPL License.
	 *
	 * License: http://www.cloudberryapp.com/license.php
	 */
	 
	 include("install/installation_page.php");	 
?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<html>
	<?php pageHeader("Cloudberry Update", "init"); ?>
	
	<?php pageBody(); ?>

	<p>
		<?php echo $installer->updateSummary(); ?>
	</p>
	<p>
		Click "Update" to start update.
	</p>
	<p>
		<a id="button-update" href="javascript: action('update');" class="btn btn-success">Update</a>
	</p>

	<?php pageFooter(); ?>
</html>