const fs = require('fs').promises
const path = require('path')
const core = require('@actions/core')
const exec = require('@actions/exec')
const detectIndent = require('detect-indent')
const semver = require('semver')

function getBooleanInput(input) {
	return !['', 'undefined', 'null', 'false', '0', 'no', 'off'].includes(String(input).toLowerCase().trim())
}

async function run() {
	try {
		const commitMessage = process.env.COMMIT_MESSAGE || 'Automated commit by `auto-commit-and-version` action'
		const releaseType = process.env.RELEASE_TYPE || 'patch'
		const configJson = process.env.CONFIG_JSON || 'package.json'
		const excludeFiles = process.env.EXCLUDE_FILES || ':!*.lock :!*.lockfile :!*.lock[A-Za-z0-9] :!*[.-]lock.* :!*.snapshot :!*.resolved :!*go.sum'
		const cleanExcludedFiles = process.env.CLEAN_EXCLUDED_FILES || 'yes'

		// Check for changes
		let gitStatusArgs = ['status', '--porcelain']

		// Use exclude patterns if EXCLUDE_FILES is not falsy
		if (getBooleanInput(excludeFiles)) {
			gitStatusArgs = [...gitStatusArgs, '--untracked-files=no', '--', '.', ...excludeFiles.split(' ')]
		}

		let { stdout: hasChanges } = await exec.getExecOutput('git', gitStatusArgs)
		hasChanges = !!hasChanges.trim().length
		console.log('hasChanges', hasChanges)

		if (!hasChanges) {
			if (getBooleanInput(cleanExcludedFiles)) {
				console.log('No tracked changes detected. Cleaning up any excluded files...')
				// Restore working tree files from index
				await exec.exec('git', ['restore', '.'])
				await exec.exec('git', ['checkout', '--', '.'])
				await exec.exec('git', ['clean', '-fd'])
			}
			core.setOutput('changes-made', '')
			return console.log(`No changes detected.`)
		}

		let json = {}
		// Bump patch version in config json
		if (getBooleanInput(releaseType) && getBooleanInput(configJson)) {
			console.log(`Using config file: ${path.resolve(configJson)}`)
			const content = await fs.readFile(configJson, 'utf-8')
			if (!content) {
				throw new Error(`Content is empty`)
			}

			json = JSON.parse(content)
			if (!json.version) {
				throw new Error(`The config file does not contain a version key`)
			}
			if (!semver.valid(json.version)) {
				throw new Error(`Invalid semantic version: ${json.version}`)
			}

			json.version = semver.inc(json.version, releaseType)

			await fs.writeFile(configJson, JSON.stringify(json, null, detectIndent(content).indent))
		}

		// Set git config
		await exec.exec('git', ['config', 'user.name', 'github-actions'])
		await exec.exec('git', ['config', 'user.email', 'github-actions@github.com'])

		// Commit changes
		if (hasChanges) {
			await exec.exec('git', ['add', '.'])
			await exec.exec('git', ['commit', '-m', commitMessage.replace('{version}', json?.version ?? 'unknown')])
		}

		// Push
		await exec.exec('git', ['push'])

		return core.setOutput('changes-made', 'true')
	} catch (error) {
		return core.setFailed(error.message)
	}
}

run()
