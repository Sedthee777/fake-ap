import React from 'react'
import { render } from '@testing-library/react'
import * as jwt from 'atlassian-jwt'
import moment from 'moment'
import _get from 'lodash/get'
import config from 'config'
import FakeAP from 'fake-ap'

const date = new Date()
moment.now = () => date

const AP = new FakeAP()
let options = null

beforeEach(() => {
  config.resetConfig()
})

describe('context', () => {
  describe('getToken', () => {
    const clientKey = 'key'
    const sharedSecret = 'secret'
    const userId = 'user'

    beforeEach(() => {
      options = { clientKey, sharedSecret, userId }
    })

    describe('when a client key, a shared secret and a user ID are provided', () => {
      beforeEach(() => {
        AP.configure(options)
      })

      it('includes the client key and user ID', async () => {
        const token = await AP.context.getToken()

        const payload = jwt.decode(token, null, true)

        expect(payload).toHaveProperty('iss', clientKey)
        expect(payload).toHaveProperty('sub', userId)
      })

      it('is valid for 5 minutes', async () => {
        const now = moment().utc()

        const token = await AP.context.getToken()

        const payload = jwt.decode(token, null, true)

        expect(payload).toHaveProperty('iat', now.unix())
        expect(payload).toHaveProperty('exp', now.add(5, 'minutes').unix())
      })

      it('is signed using the shared secret', async () => {
        const token = await AP.context.getToken()

        expect(() => jwt.decode(token, sharedSecret)).not.toThrow()
      })
    })

    describe('when no client key is provided', () => {
      describe('when a missingConfigurationAction method is provided', () => {
        const missingConfigurationAction = jest.fn(() => 'result')

        beforeEach(() => {
          const { clientKey, ...missingConfigurationOptions } = options

          AP.configure({ ...missingConfigurationOptions, missingConfigurationAction })

          missingConfigurationAction.mockClear()
        })

        it('calls the provided missingConfigurationAction method', async () => {
          await AP.context.getToken()

          expect(missingConfigurationAction).toHaveBeenCalledWith('AP.context.getToken', 'clientKey')
        })

        it('returns the result from the call', async () => {
          const result = await AP.context.getToken()

          expect(result).toEqual('result')
        })
      })

      describe('when no missingConfigurationAction method is provided', () => {
        beforeEach(() => {
          const { clientKey, ...missingConfigurationOptions } = options

          AP.configure(missingConfigurationOptions)
        })

        it('throws an error', async () => {
          const promise = AP.context.getToken()

          await expect(promise).rejects.toEqual(
            new Error('Missing configuration for AP.context.getToken: clientKey')
          )
        })
      })
    })

    describe('when no shared secret is provided', () => {
      describe('when a missingConfigurationAction method is provided', () => {
        const missingConfigurationAction = jest.fn(() => 'result')

        beforeEach(() => {
          const { sharedSecret, ...missingConfigurationOptions } = options

          AP.configure({ ...missingConfigurationOptions, missingConfigurationAction })

          missingConfigurationAction.mockClear()
        })

        it('calls the provided missingConfigurationAction method', async () => {
          await AP.context.getToken()

          expect(missingConfigurationAction).toHaveBeenCalledWith('AP.context.getToken', 'sharedSecret')
        })

        it('returns the result from the call', async () => {
          const result = await AP.context.getToken()

          expect(result).toEqual('result')
        })
      })

      describe('when no missingConfigurationAction method is provided', () => {
        beforeEach(() => {
          const { sharedSecret, ...missingConfigurationOptions } = options

          AP.configure(missingConfigurationOptions)
        })

        it('throws an error', async () => {
          const promise = AP.context.getToken()

          await expect(promise).rejects.toEqual(
            new Error('Missing configuration for AP.context.getToken: sharedSecret')
          )
        })
      })
    })

    describe('when no user ID is provided', () => {
      describe('when a missingConfigurationAction method is provided', () => {
        const missingConfigurationAction = jest.fn(() => 'result')

        beforeEach(() => {
          const { userId, ...missingConfigurationOptions } = options

          AP.configure({ ...missingConfigurationOptions, missingConfigurationAction })

          missingConfigurationAction.mockClear()
        })

        it('calls the provided missingConfigurationAction method', async () => {
          await AP.context.getToken()

          expect(missingConfigurationAction).toHaveBeenCalledWith('AP.context.getToken', 'userId')
        })

        it('returns the result from the call', async () => {
          const result = await AP.context.getToken()

          expect(result).toEqual('result')
        })
      })

      describe('when no missingConfigurationAction method is provided', () => {
        beforeEach(() => {
          const { userId, ...missingConfigurationOptions } = options

          AP.configure(missingConfigurationOptions)
        })

        it('throws an error', async () => {
          const promise = AP.context.getToken()

          await expect(promise).rejects.toEqual(
            new Error('Missing configuration for AP.context.getToken: userId')
          )
        })
      })
    })
  })
})

describe('dialog', () => {
  let component = null

  beforeEach(() => {
    component = render(<div />)
  })

  describe('when the Dialogs component is not already mounted', () => {
    it('mounts a Dialogs component to display flags', () => {
      expect(component.baseElement.querySelectorAll('#ap_dialogs')).toHaveLength(1)
    })
  })

  describe('when the Dialogs component is already mounted', () => {
    beforeEach(() => {
      // eslint-disable-next-line no-new
      new FakeAP()
    })

    it('does not mount another Dialogs component', () => {
      expect(component.baseElement.querySelectorAll('#ap_dialogs')).toHaveLength(1)
    })
  })
})

describe('events', () => {
  describe('on', () => {
    it('registers a listener to be called every time the provided event is emitted', () => {
      const listener = jest.fn()

      AP.events.emit('event')

      expect(listener).not.toHaveBeenCalled()

      AP.events.on('event', listener)
      AP.events.emit('event')
      AP.events.emit('event')

      expect(listener).toHaveBeenCalledTimes(2)
    })
  })

  describe('once', () => {
    it('registers a listener to be called once the provided event is emitted', () => {
      const listener = jest.fn()

      AP.events.emit('event')

      expect(listener).not.toHaveBeenCalled()

      AP.events.once('event', listener)
      AP.events.emit('event')

      expect(listener).toHaveBeenCalledTimes(1)

      AP.events.emit('event')
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('off', () => {
    it('removes a listener for the provided event', () => {
      const listener = jest.fn()

      AP.events.on('event', listener)
      AP.events.emit('event')
      AP.events.emit('event')

      expect(listener).toHaveBeenCalledTimes(2)

      AP.events.off('event', listener)
      AP.events.emit('event')

      expect(listener).toHaveBeenCalledTimes(2)
    })
  })

  describe('emit', () => {
    it('calls all listeners registered for the provided event using the provided payload', () => {
      const firstListener = jest.fn()
      const secondListener = jest.fn()

      AP.events.on('event', firstListener)
      AP.events.on('event', secondListener)

      const args = {
        hello: 'world'
      }

      AP.events.emit('event', args)

      expect(firstListener).toHaveBeenCalledWith(args)
      expect(secondListener).toHaveBeenCalledWith(args)
    })

    it('does not call listeners registered for another event', () => {
      const firstListener = jest.fn()
      const secondListener = jest.fn()
      const otherListener = jest.fn()

      AP.events.on('event', firstListener)
      AP.events.on('event', secondListener)
      AP.events.on('other_event', otherListener)

      AP.events.emit('event')

      expect(firstListener).toHaveBeenCalled()
      expect(secondListener).toHaveBeenCalled()
      expect(otherListener).not.toHaveBeenCalled()
    })
  })
})

describe('flag', () => {
  let component = null

  beforeEach(() => {
    component = render(<div />)
  })

  describe('when the Flags component is not already mounted', () => {
    it('mounts a Flags component to display flags', () => {
      expect(component.baseElement.querySelectorAll('#ap_flags')).toHaveLength(1)
    })
  })

  describe('when the Flags component is already mounted', () => {
    beforeEach(() => {
      // eslint-disable-next-line no-new
      new FakeAP()
    })

    it('does not mount another Flags component', () => {
      expect(component.baseElement.querySelectorAll('#ap_flags')).toHaveLength(1)
    })
  })
})

describe('history', () => {
  afterEach(() => {
    window.location.hash = ''
  })

  describe('getState', () => {
    it('returns the current state', () => {
      expect(AP.history.getState()).toEqual('')

      AP.history.pushState('state')

      expect(AP.history.getState()).toEqual('state')

      AP.history.pushState('other_state')

      expect(AP.history.getState()).toEqual('other_state')
    })
  })

  describe('popState', () => {
    it('registers a listener that is called every time the state is changed using pushState', () => {
      const listener = jest.fn()
      AP.history.popState(listener)

      AP.history.pushState('state')

      expect(listener).toHaveBeenCalledTimes(1)

      AP.history.pushState('other_state')

      expect(listener).toHaveBeenCalledTimes(2)
    })
  })

  describe('pushState', () => {
    it('changes the hash of the current location', () => {
      expect(window.location.hash).toEqual('')

      AP.history.pushState('state')

      expect(window.location.hash).toEqual('#!state')

      AP.history.pushState('other_state')

      expect(window.location.hash).toEqual('#!other_state')
    })
  })

  describe('_clearHistory', () => {
    const listener = jest.fn()

    beforeEach(() => {
      listener.mockClear()

      AP.history.popState(listener)
      AP.history.pushState('state')
      AP.history._clearHistory()
    })

    it('clears the hash of the current location', () => {
      expect(window.location.hash).toEqual('')
    })

    it('clears the current state', () => {
      expect(AP.history.getState()).toEqual('')
    })

    it('clears the list of listeners', () => {
      AP.history.pushState('other_state')

      expect(listener).toHaveBeenCalledTimes(1)
    })
  })
})

describe('user', () => {
  describe('getLocale', () => {
    describe('when a locale is provided in configuration', () => {
      beforeEach(() => {
        AP.configure({ locale: 'fr_FR' })
      })

      it('calls the provided callback with the configuration locale', () => {
        const callback = jest.fn()

        AP.user.getLocale(callback)

        expect(callback).toHaveBeenCalledWith('fr_FR')
      })
    })

    describe('when no locale is provided in configuration', () => {
      it('calls the provided callback with english set as the locale', () => {
        const callback = jest.fn()

        AP.user.getLocale(callback)

        expect(callback).toHaveBeenCalledWith('en_US')
      })
    })
  })
})

const notImplementedMethods = [
  'context.getContext',
  'cookie.save',
  'cookie.read',
  'cookie.erase',
  'dialog.getButton',
  'dialog.disableCloseOnSubmit',
  'dialog.createButton',
  'dialog.isCloseOnEscape',
  'events.onPublic',
  'events.oncePublic',
  'events.onAny',
  'events.onAnyPublic',
  'events.offPublic',
  'events.offAll',
  'events.offAllPublic',
  'events.offAny',
  'events.offAnyPublic',
  'events.emitPublic',
  'history.back',
  'history.forward',
  'history.go',
  'history.replaceState',
  'host.getSelectedText',
  'resize',
  'sizeToParent',
  'inlineDialog.hide',
  'jira.refreshIssuePage',
  'jira.getWorkflowConfiguration',
  'jira.isDashboardItemEditable',
  'jira.openCreateIssueDialog',
  'jira.setDashboardItemTitle',
  'jira.openDatePicker',
  'jira.initJQLEditor',
  'jira.showJQLEditor',
  'jira.isNativeApp',
  'navigator.getLocation',
  'navigator.go',
  'navigator.reload',
  'user.getCurrentUser',
  'user.getTimeZone'
]

describe('Not implemented methods', () => {
  describe.each(notImplementedMethods)('AP.%s', method => {
    describe('when a notImplementedAction method is provided', () => {
      const notImplementedAction = jest.fn(() => 'result')

      beforeEach(() => {
        AP.configure({ notImplementedAction })

        notImplementedAction.mockClear()
      })

      it('calls the provided notImplementedAction method', async () => {
        const args = ['hello', 'world']

        await _get(AP, method)(...args)

        expect(notImplementedAction).toHaveBeenCalledWith(`AP.${method}`, ...args)
      })

      it('returns the result from the call', async () => {
        const result = await _get(AP, method)()

        expect(result).toEqual('result')
      })
    })

    describe('when no notImplementedAction method is provided', () => {
      it('does not return anything', async () => {
        const result = await _get(AP, method)()

        expect(result).toBeUndefined()
      })
    })
  })
})
