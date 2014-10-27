<?php

namespace Cloudberry\Core;

use Cloudberry\Core\Permissions\PermissionController;
use Illuminate\Support\Facades\Log;

class CloudberryController {
	private $permissions;
	private $plugins = array();

	public function __construct(PermissionController $permissionController) {
		$this->permissions = $permissionController;
	}

	public function registerPlugin($id, $a) {
		$this->plugins[$id] = $a;
	}

	public function getPlugins() {
		Log::info($this->plugins);
		return $this->plugins;
	}

	public function init($request) {
		$this->permissions->registerPermission("change_password");

		foreach ($this->plugins as $plugin) {
			if (array_key_exists("init", $plugin)) {
				$plugin["init"]($request);
			}
		}
	}
}
