<?php

namespace Kryptolib\PluncX\Factories;

/**
 * Iterates over an array of FactoryModels
 */
class FactoryIterator implements \Iterator
{
    private $FactoryModels;
    private $position;

    public function __construct(array $FactoryModels) {
        $this->FactoryModels = $FactoryModels;
        $this->position = 0;
    }

    public function current(): FactoryModel {
        return $this->FactoryModels[$this->position];
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
        return isset($this->FactoryModels[$this->position]);
    }
}
