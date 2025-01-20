<?php 

namespace Kryptolib\PluncX\App;

class DependencyIterator implements \Iterator
{
    private $DependencyItems;
    private $position;

    public function __construct(array $DependencyItems) {
        $this->DependencyItems = $DependencyItems;
        $this->position = 0;
    }

    public function current(): DependencyItem {
        return $this->DependencyItems[$this->position];
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
        return isset($this->DependencyItems[$this->position]);
    }
}