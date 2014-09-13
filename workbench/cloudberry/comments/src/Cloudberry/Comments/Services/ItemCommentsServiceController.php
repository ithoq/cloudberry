<?php

namespace Cloudberry\Comments\Services;

use \Cloudberry\Comments\Comment;

class ItemCommentsServiceController extends \Cloudberry\Core\Services\BaseServiceController {

	public function getIndex($itemId) {
		$item = $this->_getItem($itemId);
		return Comment::forItem($itemId);
	}

	public function postIndex($itemId) {
		if (!Input::has("comment")) {
			$this->invalidRequestJsonResponse("Missing comment");
		}
		$item = $this->_getItem($itemId);

		$comment = Comment::create(array(
				'comment' => Input::get("comment"),
				'user_id' => Auth::user()->id
			));
		$comment->item()->save($item->getItemId());
		return array();
	}

	public function deleteIndex($itemId, $commentId) {
		//TODO permissions
		//TODO own comment/admin
		$item = $this->_getItem($itemId);
		$comment = Comment::find($commentId);
		//TODO validate comment from right item? find via comment->item?
		if ($comment != NULL) {
			$comment->delete();
		}
		return array();
	}
}