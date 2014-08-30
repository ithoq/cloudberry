<?php

namespace Cloudberry\Core\Filesystem;

class ItemId extends \Eloquent {
	protected $table = 'item_ids';
	protected $fillable = array('root_folder_id', 'path');

	public $incrementing = false;

	protected static function boot() {
		parent::boot();

		static::creating(function ($itemId) {
			$itemId->{ $itemId->getKeyName()} = uniqid("");//create unique id (UUID?)
		});
	}

	public function getRootFolderId() {
		return $this->root_folder_id;
	}
}