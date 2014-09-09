<?php

namespace Cloudberry\Comments;

class Comment extends \Eloquent {

	protected $table = 'comments';

	protected $hidden = array();

	public function item() {
		return $this->belongsToMany('Cloudberry\Core\Filesystem\ItemId', 'items_comments', 'item_id', 'comment_id');
	}

	public static function forItem($item) {
		$id = is_string($item) ? $item : $item->getId();
		return Comment::has('item', '=', $id)->get();
	}

}
