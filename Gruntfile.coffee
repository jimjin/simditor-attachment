module.exports = (grunt)->
  grunt.initConfig(
    pkg: grunt.file.readJSON('package.json'),
    coffee:
      compile:
        files:
          "lib/simditor-attachment.js":"src/simditor-attachment.coffee"
    sass:
        dist:
        	file:
          		'lib/simditor-attachment.css': 'src/simditor-attachment.scss'
          	options:
          		sourcemap: 'false'
  )
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-sass'
  grunt.registerTask 'default', ['coffee:compile']
