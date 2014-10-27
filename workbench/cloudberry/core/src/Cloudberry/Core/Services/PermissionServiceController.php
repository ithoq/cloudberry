<?php

namespace Cloudberry\Core\Services;

use Cloudberry\Core\Permissions\PermissionController;
use \FSC;
use \Input;

class PermissionServiceController extends BaseServiceController {
	private $permissions;

	public function __construct(PermissionController $permissionController) {
		$this->permissions = $permissionController;
	}

	public function getPermissionTypes() {
		return $this->permissions->getTypes();
	}

	public function getPermissionList() {
		$name = Input::has("name") ? Input::get("name") : NULL;
		$subject = Input::has("subject") ? Input::get("subject") : NULL;
		$userId = Input::has("user_id") ? Input::get("user_id") : NULL;
		$permissions = $this->permissions->getPermissions($name, $subject, $userId);

		/*$result = array("permissions" => $permissions);
		$users = (Input::has("u") and strcmp(Input::get("u"), "1") == 0);
		if ($users) {
		$result["users"] = $this->env->configuration()->getAllUsers(TRUE);
		}

		$this->response()->success($result);*/
		return $permissions;
	}

	public function getGenericPermissionList() {
		$name = Input::has("name") ? Input::get("name") : NULL;
		$subject = Input::has("subject") ? Input::get("subject") : NULL;
		$userId = Input::has("user_id") ? Input::get("user_id") : NULL;
		$permissions = $this->permissions->getGenericPermissions(NULL, $userId);

		/*$result = array("permissions" => $permissions);
		$users = (Input::has("u") and strcmp(Input::get("u"), "1") == 0);
		if ($users) {
		$result["users"] = $this->env->configuration()->getAllUsers(TRUE);
		}

		$this->response()->success($result);*/
		return $permissions;
	}

	public function getGenericUserPermissions($userId) {
		$permissions = $this->permissions->getGenericPermissions(NULL, $userId);
		return $permissions;
	}

	public function getUserPermissions($userId) {
		$subject = Input::get("subject");
		$effective = (Input::has("e") and strcmp(Input::get("e"), "1") == 0);
		$name = Input::get("name");

		if ($subject != NULL and $effective and $name != NULL) {
			$item = FSC::getItem($subject);
			return $this->permissions->getEffectiveFilesystemPermissions($name, $item, $userId);
		} else {
			return $this->permissions->getPermissions(NULL, $subject, $userId);
		}
	}
}
