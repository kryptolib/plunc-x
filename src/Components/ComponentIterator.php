<?php

namespace Kryptolib\PluncX\Components;

/**
 * Iterates over an array of components
 */
class ComponentIterator implements \Iterator
{
    private $ComponentModels;
    private $position;

    public function __construct(array $ComponentModels) {
        $this->ComponentModels = $ComponentModels;
        $this->position = 0;
    }

    public function current(): ComponentModel {
        return $this->ComponentModels[$this->position];
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
        return isset($this->ComponentModels[$this->position]);
    }
}
