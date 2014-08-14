<?php
	/**
	 * AuthenticatorPW.class.php
	 *
	 * Copyright 2014- Samuli Järvelä
	 * Released under GPL License.
	 *
	 * License: http://www.cloudberryapp.com/license.php
	 */

	class Cloudberry_Authenticator_PW extends Cloudberry_Authenticator {
		private $env;
		
		public function __construct($env) {
			$this->env = $env;
		}
		
		public function authenticate($user, $pw, $auth) {
			if ($auth["salt"] == "-" and $auth["hash"] == "-") {
				$oldPw = $this->env->configuration()->getUserLegacyPw($user["id"]);
				// old pw auth
				if (strcmp($oldPw, md5($pw)) != 0) return FALSE;
				
				//convert old pws into hash
				Logging::logDebug("Adding new user hash for ".$user["id"]);
				$this->env->configuration()->storeUserAuth($user["id"], $user["name"], $auth["type"], $pw);
				return TRUE;
			}
			return ($this->env->passwordHash()->isEqual($pw, $auth["hash"], $auth["salt"]));
		}
	}
?>