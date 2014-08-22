<?php

namespace Cloudberry\Filesystem;


class ItemIdProvider {
	private $cache = array();

	public function getItemId($id) {
		if (array_key_exists($id, $this->cache)) return $this->cache[$id];
		$itemId = ItemId::find($id);
		$this->cache[$id] = $itemId;
		return $itemId;
	}

	public function getItemIdByPath($rootId, $path, $create = TRUE) {
		// path cache?
		$itemId = ItemId::firstOrCreate(array('root_folder_id' => $rootId, "path" => $path));
		$this->cache[$itemId->id] = $itemId;
		return $itemId;
	}
}