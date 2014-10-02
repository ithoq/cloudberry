<?php

namespace Cloudberry\Core\Services;

use Cloudberry\Core\Permissions\PermissionController;

class PermissionServiceController extends BaseServiceController {
	private $permissions;

	public function __construct(PermissionController $permissionController) {
		$this->permissions = $permissionController;
	}

	public function getPermissionTypes() {
		return $this->permissions->getTypes();
	}
}