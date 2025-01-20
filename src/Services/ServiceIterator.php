<?php

namespace Kryptolib\PluncX\Services;

/**
 * Iterates over an array of components
 */
class ServiceIterator implements \Iterator
{
    private $ServiceModels;
    private $position;

    public function __construct(array $ServiceModels) {
        $this->ServiceModels = $ServiceModels;
        $this->position = 0;
    }

    public function current(): ServiceModel {
        return $this->ServiceModels[$this->position];
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
        return isset($this->ServiceModels[$this->position]);
    }
}
