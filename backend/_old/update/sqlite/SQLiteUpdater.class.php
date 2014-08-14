<?php

	/**
	 * SQLiteUpdater.class.php
	 *
	 * Copyright 2014- Samuli Järvelä
	 * Released under GPL License.
	 *
	 * License: http://www.cloudberryapp.com/license.php
	 */
	
	require_once("install/sqlite/SQLiteInstaller.class.php");

	class SQLiteUpdater extends SQLiteInstaller {

		public function __construct($settings) {
			parent::__construct($settings, "update");
		}
				
		public function updateVersionStep($from, $to) {
			$this->util()->updateVersionStep($from, $to);
		}
		
		public function getConversion($versionTo) {
			return NULL;
		}
		
		public function process() {}
		
		public function __toString() {
			return "SQLiteUpdater";
		}	
	}
?>