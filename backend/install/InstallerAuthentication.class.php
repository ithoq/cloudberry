<?php

	/**
	 * InstallerAuthentication.class.php
	 *
	 * Copyright 2014- Samuli Järvelä
	 * Released under GPL License.
	 *
	 * License: http://www.cloudberryapp.com/license.php
	 */

	require_once("include/Authentication.class.php");
	
	class InstallerAuthentication extends Authentication {
		public function __construct($env) {
			parent::__construct($env);
		}
	}
?>