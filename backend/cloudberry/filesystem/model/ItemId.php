<?php

namespace Cloudberry\Filesystem;

class ItemId extends \Eloquent {
	protected $table = 'item_ids';
	protected $fillable = array('root_folder_id', 'path');

	public $incrementing = false;

	protected static function boot() {
		parent::boot();

		static ::creating(function ($itemId) {
			$itemId->{ $itemId->getKeyName()} = uniqid("");//create unique id (UUID?)
		});
	}
}