<?php 

namespace Kryptolib\PluncX\Services;

use Kenjiefx\ScratchPHP\App\Themes\ThemeController;
use Kryptolib\PluncX\App\MinifiedTokenRegistry;
use Kryptolib\PluncX\App\UniqueTokenRegistry;
use Kryptolib\PluncX\Handlers\HandlerName;
use Kryptolib\PluncX\Handlers\HandlerService;

class ServiceRegistry {

    private static array $ServiceModels = [];

    public static function collect(){

        /** Ensures that we only look up once */
        if (ServiceRegistry::has_looked_up()) return;

        $ThemeController = new ThemeController();
        $services_dir 
            = HandlerService::convert(
                $ThemeController->getdir() . '/services'
            );

        if (!\is_dir($services_dir)) return;
        ServiceRegistry::lookup($services_dir);
    }

    private static function has_looked_up(): bool {
        return count(static::$ServiceModels) > 0;
    }

    private static function lookup(
        string $directory
    ){
        $files = \array_diff(
            \scandir($directory), 
            ['.', '..']
        );
        foreach ($files as $file) {
            $path = $directory.'/'.$file;
            if (\is_dir($path)) {
                ServiceRegistry::lookup($path);
                continue;
            }
            ServiceRegistry::register($path);
        }
    }

    public static function get(): ServiceIterator {
        return new ServiceIterator(
            static::$ServiceModels
        );
    }

    public static function find(
        string $absolute_path
    ): ServiceModel {
        $result = null;
        foreach (ServiceRegistry::get() as $ServiceModel) {
            if ($ServiceModel->absolute_path === $absolute_path) {
                $result = $ServiceModel;
            }
        }
        return $result;
    }

    private static function register(
        string $path
    ){
        $absolute_path 
            = str_replace('/', "\\", $path);
        $object_name 
            = basename($path, ".js");
        $ServiceName = new HandlerName(
            $object_name,
            $object_name,
            UniqueTokenRegistry::generate(
                $object_name,
                $absolute_path
            ),
            MinifiedTokenRegistry::generate()
        );
        array_push(
            static::$ServiceModels,
            new ServiceModel(
                $ServiceName,
                $absolute_path
            )
        );
    }

}