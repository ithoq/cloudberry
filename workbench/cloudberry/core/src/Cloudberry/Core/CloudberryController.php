<?php

namespace Cloudberry\Core;

use Illuminate\Support\Facades\Log;

class CloudberryController {
	private $plugins = array();

	public function registerPlugin($id, $a) {
		$this->plugins[$id] = $a;
	}

	public function getPlugins() {
		Log::info($this->plugins);
		return $this->plugins;
	}
}