<?php

namespace Cloudberry\Core\Permissions;

class PermissionController {

	private $genericPermissions = array();
	private $filesystemPermissions = array();

	public function __construct() {

	}

	public function registerFilesystemPermission($name, $values = NULL) {
		$this->filesystemPermissions[$name] = $values;
	}

	public function registerPermission($name, $values = NULL) {
		$this->genericPermissions[$name] = $values;
	}

	public function getTypes() {
		return array("generic" => $this->genericPermissions, "filesystem" => $this->filesystemPermissions);
	}

	public function hasFilesystemPermission($name, $item, $required = NULL) {
		if (!array_key_exists($name, $this->filesystemPermissions)) {
			new \Cloudberry\Core\CloudberryException("Invalid permission key: " . $name);
		}

		$values = $this->filesystemPermissions[$name];
		if ($required != NULL and $values != NULL) {
			$requiredIndex = array_search($required, $values);
			if ($requiredIndex === FALSE) {
				new \Cloudberry\Core\CloudberryException("Invalid permission value: " . $required);
			}
		}

		if (\Auth::user()->isAdmin()) {
			return TRUE;
		}

		$userValue = $this->getFilesystemPermission($name, $item);
		if (!$userValue) {
			return FALSE;
		}

		// on/off permission is found
		if ($values == NULL) {
			return ($userValue == "1");
		}

		$userValueIndex = array_search($userValue, $values);
		if ($userValueIndex === FALSE) {
			new \Cloudberry\Core\CloudberryException("Invalid permission value: " . $userValue);
		}

		// check permission level by index
		return $userValueIndex >= $requiredIndex;
	}
}