<?php

namespace Cloudberry\Comments;

class Comment extends \Eloquent {

	protected $table = 'comments';

	protected $fillable = array('comment', 'user_id');
	protected $hidden = array("item");

	public function item() {
		return $this->belongsToMany('Cloudberry\Core\Filesystem\ItemId', 'items_comments', 'comment_id', 'item_id')->withPivot("item_id");
	}

	public static function forItem($item) {
		$id = is_string($item) ? $item : $item->getId();
		return Comment::with("item")->whereHas('item', function ($query) use ($id) {
			$query->where('item_id', '=', $id);
		})->get();
	}

}
