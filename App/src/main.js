var fs = require( 'fs' );
var wrench = require( 'wrench' );
var exec = require( 'child_process' ).exec;

// existance check (TODO: create config file)
if ( !fs.existsSync( '/Applications/Atom.app' ) ) {
    alert( "aroche can't find Atom-shell App. Please fix Atom-shell application's path in config file, or download Atom-shell https://github.com/atom/atom-shell/releases" );
    process.exit();
}

var vue = new Vue( {
    el: "body",
    data: {
        screenMode: 'default',
        projectName: '',
        temporaryProjectName: '',
        projectPath: '',
        enterNewProject: false,
        enterEditProjectName: false,
    },
    methods: {
        newProjectView: function () {
            this.enterNewProject = true;
            setTimeout("$( '#js-newproject-nameinput' ).focus()", 10); // TODO: use callback
        },
        createNewProject: function () {
            if ( this.projectName === '' ) return this.enterNewProject = false;
            $( '#js-newproject' ).click();
        },
        cancelNewProject: function () {
            this.projectName = '';
            this.enterNewProject = false;
        },
        closeProject: function () {
            this.projectName = '';
            this.projectPath = '';
            this.screenMode = 'default';
        },
        okRename: function () {
            if ( this.temporaryProjectName === '' ) {
                showMessage( 'error', 'Enter new project name.' );
                return;
            }
            var projectPath = this.projectPath.substr( 0, this.projectPath.lastIndexOf( '/' ) ) + '/' + this.temporaryProjectName;
            if ( fs.existsSync( projectPath ) ) {
                showMessage( 'error', 'This project name already exists on directory.' );
                return;
            }
            fs.renameSync( this.projectPath, projectPath );
            this.projectName = this.temporaryProjectName;
            this.temporaryProjectName = '';
            this.projectPath = projectPath;
            setLastOpened( this.projectPath );
            this.enterEditProjectName = false;
            showMessage( 'success', 'New project name : ' + this.projectName );
        },
        cancelRename: function () {
            this.temporaryProjectName = '';
            this.enterEditProjectName = false;
        },
        openDirectory: function () {
            exec( 'open ' + this.projectPath, function () {} ); // TODO: error handle
        },
        openLast: function () {
            var lastPath = getLastOpenedProjectPath();
            if ( !fs.existsSync( lastPath ) ) {
                showMessage( 'error', 'Last opened project is not recorded.' );
                return;
            }
            this.projectPath = getLastOpenedProjectPath();
            this.projectName = getProjectNameFromPath( this.projectPath );
            this.screenMode = 'project';
            showMessage( 'success', 'Load project : ' + this.projectName );
        },
        runProject: function () {
            exec( '/Applications/Atom.app/Contents/MacOS/Atom ' + this.projectPath + '/App', function () {} ); // TODO: error handle
        },
        buildProject: function () {
            buildProject( this.projectPath );
            $( '#audioclip' )[0].play();
            showMessage( 'success', 'Build success' );
            exec( 'open ' + this.projectPath + '/Build/Atom.app' );
        }
    }
} );

$( function () {
    $( '#js-newproject' ).change( function () {
        var path = $( '#js-newproject' ).val();
        var projectPath = path + '/' + vue.projectName;
        createNewProject( projectPath );
    } );
    $( '#js-openproject-enter' ).click( function () {
        $( '#js-openproject' ).click();
    } );
    $( '#js-openproject' ).change( function () {
        var path = $( '#js-openproject' ).val();
        if ( !isProjectPath( path ) ) {
            showMessage( 'error', 'The directory was non project directory.' );
        }
        vue.projectPath = path;
        vue.projectName = getProjectNameFromPath( path );
        setLastOpened( path );
        vue.screenMode = 'project';
        showMessage( 'success', 'Load project : ' + vue.projectName );
    } );
} );

var createNewProject = function ( projectPath ) {
    if ( fs.existsSync( projectPath ) ) {
        showMessage( 'error', 'Same named project already exists on directory.' );
        $( '#js-newproject' ).val( '' );
        return;
    }
    wrench.copyDirSyncRecursive( './atom-app', projectPath, { forceDelete: true } );
    vue.projectPath = projectPath;
    vue.enterNewProject = false;
    var packageJsonPath = projectPath + '/App/package.json';
    var packageJson = require( packageJsonPath );
    packageJson.name = vue.projectName;
    fs.writeFileSync( packageJsonPath, JSON.stringify( packageJson ) );
    setLastOpened( projectPath );
    vue.screenMode = 'project';
    showMessage( 'success', 'New project created.' );
};
var isProjectPath = function ( dirpath ) {
    return fs.existsSync( dirpath + '/App' ) &&
           fs.existsSync( dirpath + '/Build' ) &&
           fs.existsSync( dirpath + '/Resources' ) &&
           fs.existsSync( dirpath + '/App/package.json' );
};
var setLastOpened = function ( projectPath ) {
    var packageJson = require( './package.json' );
    packageJson.last_opened = projectPath;
    fs.writeFileSync( './package.json', JSON.stringify( packageJson ) );
};
var getLastOpenedProjectPath = function () {
    var packageJson = require( './package.json' );
    return packageJson.last_opened;
};
var getProjectNameFromPath = function ( path ) {
    return path.substr( path.lastIndexOf( '/' ) + 1, path.length );
};
var buildProject = function ( path ) {
    wrench.copyDirSyncRecursive( '/Applications/Atom.app', path + '/Build/Atom.app', { forceDelete: true } );
    wrench.copyDirSyncRecursive( path + '/App', path + '/Build/Atom.app/Contents/Resources/app', { forceDelete: true } );
}

var showMessage = function( type, message ) {
    $('#js-message-box').children().remove();
    var popup = $('<span/>', {
        'class' : 'alert ' + type,
        'html'  : message
    }).hide().appendTo('#js-message-box').fadeIn(300);
    setTimeout(function() {
        popup.fadeOut(200);
    }, 5000);
};