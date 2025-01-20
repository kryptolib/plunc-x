<?php 

namespace Kryptolib\PluncX;
use Kryptolib\PluncX\Components\ComponentRegistry;

class Component {

    public function __construct(string $name, string $classlist = '', string|null $as = null, string $tag = 'section'){
        ComponentRegistry::register($name);
        $unique = ComponentRegistry::retrieve($name)->name->unique;
        $alias = $as ? ' as '.$as : '';
        echo '<'.$tag.' plunc-component="'.$unique.$alias.'" class="'.$classlist.'"></'.$tag.'>';
    }

    public static function export(): void{
        $completed = false;
        $accumulator = [];
        while (!$completed) {
            foreach (ComponentRegistry::get() as $ComponentModel) {
                $name = $ComponentModel->name->real;
                $unique = $ComponentModel->name->unique;
                if (in_array($name, $accumulator)) continue;
                array_push($accumulator, $name);
                echo '<template plunc-name="'.$unique.'" plunc-namespace="'.$name.'">';
                component($name);
                echo '</template>';
            }
            $completed = ComponentRegistry::count() === count($accumulator);
        }
        
    }


}