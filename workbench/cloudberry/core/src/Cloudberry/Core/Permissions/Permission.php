<?php

namespace Cloudberry\Core\Permissions;

class Permission extends \Eloquent {
	protected $table = 'permissions';
	protected $fillable = array('user_id', 'name', 'subject', 'value');

	public $incrementing = false;

	public function getName() {
		return $this->name;
	}

	public function getUserId() {
		return $this->user_id;
	}

	public function getSubject() {
		return $this->subject;
	}

	public function getValue() {
		return $this->value;
	}

	public function scopeForUser($query, $userId) {
		return $query->where('user_id', '=', $userId);
	}

	public static function getEffectiveGeneric($name, $userId, $groupIds) {
		$userIds = array(0, $userId);
		if ($groupIds != NULL) {
			foreach ($groupIds as $g) {
				$userIds[] = $g;
			}
		}

		// order within category into 1) user specific 2) group 3) default
		$subcategoryQuery = sprintf("(IF(user_id = '%s', 1, IF(user_id = '0', 3, 2)))", $userId);

		$userCriteria = sprintf("(user_id in (%s))", $this->db->arrayString($userIds));
		$nameCriteria = is_array($name) ? sprintf("name in (%s)", \Util::dbArrayString($name, TRUE)) : sprintf("name = '%s'", $name);

		return Permission::select(DB::raw($subcategoryQuery.' as cat'))
			->where(DB::raw($userCriteria));
			->where(DB::raw($nameCriteria))
			->get();

		/*$k = array();
		$prev = NULL;
		foreach ($all as $p) {
			$name = $p["name"];
			if ($name != $prev) {$k[$name] = $p["value"];
			}

			$prev = $name;
		}
		return $k;*/
	}
}