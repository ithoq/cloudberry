<?php

namespace Cloudberry\Comments;

class Comment extends \Eloquent {

	protected $table = 'comments';

	protected $hidden = array();

	public function forItem($item) {
		$id = is_string($item) ? $item : $item->getId();
		return $this->belongsToMany('Cloudberry\Core\Filesystem\ItemId', 'items_comments', 'item_id', 'comment_id')->where('item_id', '=', $id)->get();
	}

}
