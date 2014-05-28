<?php

	/**
	 * Cookie.class.php
	 *
	 * Copyright 2014- Samuli Järvelä
	 * Released under GPL License.
	 *
	 * License: http://www.cloudberryapp.com/license.php
	 */

	class Cookie {
		private $settings = NULL;
		
		function __construct($settings) {
			$this->settings = $settings;
		}
		
		function add($name, $val, $expire = NULL) {
			setcookie($this->getName($name), $val, $expire, "/");
		}
		
		function get($name) {
			return $_COOKIE[$this->getName($name)];
		}
		
		function remove($name) {
			$this->add($name, "", time()-42000);
		}
		
		function exists($name) {
			return isset($_COOKIE[$this->getName($name)]);
		}
		
		private function getName($n) {
			$id = $this->settings ? $this->settings->setting("session_name") : FALSE;
			if (!$id) $id = "app";
			return "cloudberry_".$id."_".$n;
		}
	}
?>