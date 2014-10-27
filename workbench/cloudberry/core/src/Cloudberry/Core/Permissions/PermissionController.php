<?php

namespace Cloudberry\Core\Permissions;

class PermissionController {

	private $genericPermissions = array();
	private $filesystemPermissions = array();
	private $permissionCaches = array();
	private $filesystemPermissionPrefetchedParents = array();

	public function __construct() {
	}

	public function registerFilesystemPermission($name, $values = NULL) {
		$this->filesystemPermissions[$name] = $values;
	}

	public function registerPermission($name, $values = NULL) {
		\Log::debug("Register permission: " . $name);
		$this->genericPermissions[$name] = $values;
	}

	public function getTypes() {
		return array("generic" => $this->genericPermissions, "filesystem" => $this->filesystemPermissions);
	}

	private function getFromCache($name, $subject) {
		if (array_key_exists($name, $this->permissionCaches) and array_key_exists($subject, $this->permissionCaches[$name])) {
			$permission = $this->permissionCaches[$name][$subject];
			\Log::debug("Permission cache get [" . $name . "/" . $subject . "]=" . $permission);
			return $permission;
		}
		return FALSE;
	}

	private function putToCache($name, $subject, $value) {
		if (!array_key_exists($name, $this->permissionCaches)) {
			$this->permissionCaches[$name] = array();
		}

		$this->permissionCaches[$name][$subject] = $value;
		\Log::debug("Permission cache put [" . $name . "/" . $subject . "]=" . $value);
	}

	public function getAllPermissions() {
		return $this->getPermission(NULL);
	}

	public function getPermission($name) {
		if ($name != NULL and !array_key_exists($name, $this->genericPermissions)) {
			throw new \Cloudberry\Core\CloudberryException("Invalid permission key: " . $name);
		}

		$nameKeys = ($name != NULL ? array($name) : array_keys($this->genericPermissions));
		$userId = \Auth::user()->id;
		$groupIds = $this->getGroupIds();
		$result = array();
		$queryResult = NULL;

		foreach ($nameKeys as $nk) {
			if ($this->env->authentication()->isAdmin()) {
				$values = $this->genericPermissions[$nk];

				if ($values != NULL) {$result[$nk] = $values[count($values) - 1];
				} else {
					$result[$nk] = "1";
				}

				continue;
			}

			$permission = $this->getFromCache($nk, "");
			if ($permission !== FALSE) {
				$result[$nk] = $permission;
				continue;
			}

			if ($queryResult == NULL) {
				$queryResult = Permission::getEffectiveGeneric($name != NULL ? $name : $nameKeys)->get();
			}

			$permission = array_key_exists($nk, $queryResult) ? $queryResult[$nk] : NULL;

			if ($permission == NULL) {
				$values = $this->genericPermissions[$nk];
				if ($values != NULL) {
					//fallback to first
					$permission = $values[0];
				}
			}
			$this->putToCache($nk, "", $permission);

			$result[$nk] = $permission;
		}

		if ($name != NULL) {
			return $result[$nk];
		}

		return $result;
	}

	public function getAllFilesystemPermissions($item) {
		return $this->getFilesystemPermission(NULL, $item);
	}

	public function getFilesystemPermission($name, $item) {
		if ($item == NULL) {
			throw new \Cloudberry\Core\CloudberryException("No item defined");
		}

		if ($name != NULL and !array_key_exists($name, $this->filesystemPermissions)) {
			throw new \Cloudberry\Core\CloudberryException("Invalid permission key: " . $name);
		}

		$nameKeys = ($name != NULL ? array($name) : array_keys($this->filesystemPermissions));
		$userId = \Auth::user()->id;
		$groupIds = $this->getGroupIds();
		$id = $item->id();
		$result = array();
		$queryResult = NULL;

		foreach ($nameKeys as $nk) {
			if (\Auth::user()->isAdmin()) {
				$values = $this->filesystemPermissions[$nk];

				if ($values != NULL) {$result[$nk] = $values[count($values) - 1];
				} else {
					$result[$nk] = "1";
				}

				continue;
			}

			$permission = $this->getFromCache($nk, $id);
			if ($permission !== FALSE) {
				$result[$nk] = $permission;
				continue;
			}

			// if parent folder has been prefetched, we know item does not have specific permissions -> try parent permission
			$parent = $item->parent();
			if ($parent != NULL) {
				$parentId = $item->parent()->id();
				if (array_key_exists($nk, $this->filesystemPermissionPrefetchedParents) and in_array($parentId, $this->filesystemPermissionPrefetchedParents[$nk])) {
					$permission = $this->getFromCache($nk, $parentId);
					if ($permission !== FALSE) {
						$result[$nk] = $permission;
						continue;
					}
				}
			}

			if ($queryResult == NULL) {
				$queryResult = Permission::filesystemPermission(($name != NULL ? $name : $nameKeys), $item, $userId, $groupIds);
			}

			//Logging::logDebug("PERMISSION query: ".Util::array2str($queryResult));

			$permission = array_key_exists($nk, $queryResult) ? $queryResult[$nk] : NULL;
			//Logging::logDebug("PERMISSION query: ".$permission);

			if ($permission == NULL) {
				$values = $this->filesystemPermissions[$nk];
				if ($values != NULL) {
					$permission = $values[0];
				}
				//fallback to first
			}
			$this->putToCache($nk, $id, $permission);

			$result[$nk] = $permission;
		}

		if ($name != NULL) {
			return $result[$nk];
		}

		return $result;
	}

	public function hasFilesystemPermission($name, $item, $required = NULL) {
		if (!array_key_exists($name, $this->filesystemPermissions)) {
			throw new \Cloudberry\Core\CloudberryException("Invalid permission key: " . $name);
		}

		$values = $this->filesystemPermissions[$name];
		if ($required != NULL and $values != NULL) {
			$requiredIndex = array_search($required, $values);
			if ($requiredIndex === FALSE) {
				throw new \Cloudberry\Core\CloudberryException("Invalid permission value: " . $required);
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

	public function getGenericPermissions($name = NULL, $userId) {
		$q = Permission::start();
		if ($name != NULL) {
			$q = $q->forName($name);
		}
		$q = $q->forSubject("");
		if ($userId != NULL) {
			$q = $q->forUser($userId);
		}
		return $q->get();
	}

	public function getPermissions($name = NULL, $subject = NULL, $userId = NULL) {
		if ($name != NULL) {
			if (!array_key_exists($name, $this->genericPermissions) and !array_key_exists($name, $this->filesystemPermissions)) {
				throw new \Cloudberry\Core\CloudberryException("Invalid permission key: " . $name);
			}
		}

		//$user = \Auth::user();
		//if ($userId == $user->id and $user->isAdmin()) {
		//	return array();
		//}
		$q = Permission::start();
		if ($name != NULL) {
			$q = $q->forName($name);
		}
		if ($subject != NULL) {
			$q = $q->forSubject($subject);
		}
		if ($userId != NULL) {
			$q = $q->forUser($userId);
		}

		return $q->get();
	}

	private function getGroupIds() {
		$groupIds = array();
		/* TODO if ($this->env->session()->hasUserGroups()) {
		foreach ($this->env->session()->userGroups() as $g) {
		$groupIds[] = $g['id'];
		}
		}*/
		return $groupIds;
	}
}