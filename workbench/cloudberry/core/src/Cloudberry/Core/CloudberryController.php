<?php

namespace Cloudberry\Core;

class CloudberryController {
	private $plugins = array();

	public function registerPlugin($id) {
		$this->plugins[] = $id;
	}

	public function getPlugins() {
		return $this->plugins;
	}
}