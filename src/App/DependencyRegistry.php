<?php 

namespace Kryptolib\PluncX\App;

use Kryptolib\PluncX\Handlers\HandlerService;

class DependencyRegistry {

    private array $DependencyItems = [];

    public function __construct(){

    }

    public function register(
        string $abspath,
        string $content
    ){
        $abspath = str_replace('/', "\\", $abspath);
        if ($this->exists($abspath)) return;
        array_push(
            $this->DependencyItems, 
            new DependencyItem(
                abspath: $abspath,
                filename: basename($abspath),
                type: HandlerService::type($abspath),
                content: $content
            )
        );
    }

    public function get(): DependencyIterator {
        return new DependencyIterator(
            DependencyItems: $this->DependencyItems
        );
    }

    public function exists(
        string $abspath
    ): bool {
        $exists = false;
        foreach ($this->get() as $DependencyItem) {
            if ($DependencyItem->abspath === $abspath) {
                $exists = true;
            }
        }
        return $exists;
    }

    public function find(
        string $abspath
    ): DependencyItem | null{
        $result = null;
        foreach ($this->get() as $DependencyItem) {
            if ($DependencyItem->abspath === $abspath) {
                $result = $DependencyItem;
            }
        }
        return $result;
    }

}