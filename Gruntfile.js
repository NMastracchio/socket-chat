module.exports = function(grunt){
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    nodemon:{
      dev: {
        script: 'index.js'
      }
    },
    sass: {
      dist: {
        files: {
          'css/foundation.css': 'node_modules/foundation/scss/foundation.scss',
          'css/style.css': 'css/scss/style.scss'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-contrib-sass');

  grunt.registerTask('default',['sass','nodemon']);
};