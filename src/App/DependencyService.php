<?php 

namespace Kryptolib\PluncX\App;

class DependencyService {

    public function __construct(){

    }

    public static function lookup(
        DependencyRegistry $DependencyRegistry,
        string $content,
        string $jspath
    ){
        $paths = DependencyService::relpaths($content);
        if (count(value: $paths) === 0) return;
        $i = 0;
        foreach ($paths as $relpath) {
            $absolutepath = DependencyService::locate(
                sourcepath: $jspath,
                targetpath: $relpath
            );
            $ExistingDependency 
                = $DependencyRegistry->find($absolutepath);
            if ($ExistingDependency !== null) {
                $filecontent = $ExistingDependency->content;
            } else {
                $filecontent = file_get_contents($absolutepath);
            }
            $DependencyRegistry->register(
                abspath: $absolutepath,
                content: $filecontent
            );
            DependencyService::lookup(
                DependencyRegistry: $DependencyRegistry,
                content: $filecontent,
                jspath: $absolutepath
            );
            $i++;

        }
    }

    public static function locate(
        string $sourcepath,
        string $targetpath
    ){
        $currentdir = dirname(
            path: $sourcepath
        );
        return realpath(
            path: $currentdir . DIRECTORY_SEPARATOR . $targetpath . '.js'
        );
    }

    public static function relpaths(
        string $content
    ): array {
        $pattern = '/import\s+\{.*\}\s+from\s+[\'"](.+)[\'"];?/';
        preg_match_all(
            pattern: $pattern, 
            subject: $content, 
            matches: $matches
        );
        return $matches[1];
    }

    public static function imports(
        string $content
    ): array {
        $pattern = '/import\s+\{.*\}\s+from\s+[\'"](.+)[\'"];?/';
        preg_match_all(
            pattern: $pattern, 
            subject: $content, 
            matches: $matches
        );
        return $matches[0];
    }

}