<?php

	/**
	 * CloudberryCompressor.class.php
	 *
	 * Copyright 2014- Samuli Järvelä
	 * Released under GPL License.
	 *
	 * License: http://www.cloudberryapp.com/license.php
	 */

	interface CloudberryCompressor {
		function acceptFolders();
		
		function add($name, $path, $size = 0);
		
		function finish();
		
		function stream();
		
		function filename();
	}
?>