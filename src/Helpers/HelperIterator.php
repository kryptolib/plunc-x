<?php

namespace Kryptolib\PluncX\Helpers;

use Kryptolib\PluncX\Helpers\HelperModel;

/**
 * Iterates over an array of components
 */
class HelperIterator implements \Iterator
{
    private $HelperModels;
    private $position;

    public function __construct(array $HelperModels) {
        $this->HelperModels = $HelperModels;
        $this->position = 0;
    }

    public function current(): HelperModel {
        return $this->HelperModels[$this->position];
    }

    public function key(): int {
        return $this->position;
    }

    public function next(): void {
        $this->position++;
    }

    public function rewind(): void {
        $this->position = 0;
    }

    public function valid(): bool {
        return isset($this->HelperModels[$this->position]);
    }
}
