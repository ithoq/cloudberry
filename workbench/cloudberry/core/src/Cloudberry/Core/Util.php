<?php

namespace Cloudberry\Core;

class Util {
	public static function inBytes($a) {
		$amount = trim($a);
		$last = strtolower($amount[strlen($amount) - 1]);

		switch ($last) {
			case 'g':
				$amount *= 1024;
			case 'm':
				$amount *= 1024;
			case 'k':
				$amount *= 1024;
		}

		return (float) $amount;
	}

	public static function base64_url_encode($input) {
		return strtr(base64_encode($input), '+/=', '-_,');
	}

	public static function base64_url_decode($input) {
		return base64_decode(strtr($input, '-_,', '+/='));
	}

	public function dbArrayString($a, $quote = FALSE) {
		$result = '';
		$first = TRUE;
		foreach ($a as $s) {
			if (!$first) {
				$result .= ',';
			}

			if ($quote) {
				$result .= "'" . $s . "'";
			} else {
				$result .= $s;
			}

			$first = FALSE;
		}
		return $result;
	}

	public static function toString($a) {
		if (is_array($a)) {return self::array2str($a);
		}

		if (is_object($a)) {
			if (method_exists($a, '__toString')) {return '' . $a;
			}

			return get_class($a);
		}
		return $a;
	}

	public static function array2str($a, $ignoredKeys = NULL) {
		if ($a === NULL) {return "NULL";
		}

		$r = "{";
		$first = TRUE;
		foreach ($a as $k => $v) {
			if ($ignoredKeys != null and in_array($k, $ignoredKeys)) {continue;
			}

			if (!$first) {$r .= ", ";
			}

			$val = self::toString($v);
			$r .= $k . ':' . $val;
			$first = FALSE;
		}
		return $r . "}";
	}

	public static function isAssocArray($arr) {
		return array_keys($arr) !== range(0, count($arr) - 1);
	}

	public static function isArrayKey($a, $k) {
		return $a != NULL and isset($a[$k]) and $a[$k] != NULL;
	}
}