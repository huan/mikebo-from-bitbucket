function mikeTestRunner() {
  'use strict'
  
  if ((typeof GasTap)==='undefined') { // GasT Initialization. (only if not initialized yet.)
    eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gast/master/src/gas-tap-lib.js').getContentText())
  } // Class GasTap is ready for use now!

  var test = new GasTap()
  
//  return development()
  
  /////////////////////////////////////
  //
  //
  
  testGasContact()
  testParser()
  
  //
  //
  /////////////////////////////////////
  
  return test.finish()
  
  ///////////////////////////////////////////////
  
  function development() {
    testParser()
  }
  
  function testParser() {
    test('mapTable', function (t) {
      var EXPECT_A = 'AAA'
      var TABLE = {
        'xAx': EXPECT_A
      }
      var obj = {
        a: 'A'
        , b: 'B'
      }
      
      obj = Parser.mapTable(obj, TABLE)
      
      t.equal(obj.a, EXPECT_A, 'extracted a')
      t.ok(!obj.b, 'extracted b as empty')
    })
    
    test('MikeCRM', function (t) {
      var HTML = [
        '<div style="margin:0 45px"><div style="color:#6b777b;font-family:"Microsoft Yahe'
        ,'i","\005fae\008f6f\0096c5\009ed1",Tahoma,Arial,Helvetica,STHeiti;width:423px;pad'
        ,'ding:9px 0;margin-right:auto;margin-left:auto;margin-top:18px;margin-bottom:27px'
        ,'"><table border="0" align="center" cellpadding="0" cellspacing="0" width="405px"'
        ,'style="border:1px solid #ddd"><tbody><tr width="405px" style="color:#585858;fon'
        ,'t-size:13px"><td style="background-color:#ddd;height:18px"></td></tr><tr width="'
        ,'405px" style="color:#585858;font-size:13px"><td style="background-color:#ddd;hei'
        ,'ght:18px"></td></tr><tr width="405px" style="color:#585858;font-size:13px"><td s'
        ,'tyle="background-color:#ddd;height:18px"></td></tr><tr width="405px" style="colo'
        ,'r:#585858;font-size:13px"><td style="background-color:#ddd;height:18px"></td></t'
        ,'r><tr width="405px" style="color:#585858;font-size:13px"><td style="background-c'
        ,'olor:#ddd;height:18px"></td></tr><tr width="405px" style="color:#585858;font-siz'
        ,'e:13px"><td><table><tbody><tr style="border-bottom:0;background-color:#fff;font-'
        ,'size:13px"><td><p style="width:395px;margin-left:5px;margin-right:5px;margin-bot'
        ,'tom:2px;margin-top:5px;word-break:break-all;color:#333">创投平台项目地址</p></td></tr><t'
        ,'r style="background-color:#def6fe;font-size:13px"><td><div style="font-weight:bo'
        ,'ld;width:395px;word-break:break-all;white-space:normal;padding-left:5px;padding-'
        ,'right:5px;padding-top:8px;padding-bottom:8px;word-break:break-all;color:#344449;'
        ,'margin-top:0;margin-bottom:0">暂时性没有在任何平台上登记</div></td></tr></tbody></table></td>'
        ,'</tr><tr width="405px" style="color:#585858;font-size:13px"><td><table><tbody><t'
        ,'r style="border-bottom:0;background-color:#fff;font-size:13px"><td><p style="wid'
        ,'th:395px;margin-left:5px;margin-right:5px;margin-bottom:2px;margin-top:5px;word-'
        ,'break:break-all;color:#333">公司</p></td></tr><tr style="background-color:#def6fe;'
        ,'font-size:13px"><td><div style="font-weight:bold;width:395px;word-break:break-al'
        ,'l;white-space:normal;padding-left:5px;padding-right:5px;padding-top:8px;padding-'
        ,'bottom:8px;word-break:break-all;color:#344449;margin-top:0;margin-bottom:0">长沙市阡'
        ,'陌商务信息咨询有限公司</div></td></tr></tbody></table></td></tr><tr width="405px" style="co'
        ,'lor:#585858;font-size:13px"><td><table><tbody><tr style="border-bottom:0;backgro'
        ,'und-color:#fff;font-size:13px"><td><p style="width:395px;margin-left:5px;margin-'
        ,'right:5px;margin-bottom:2px;margin-top:5px;word-break:break-all;color:#333">网址</'
        ,'p></td></tr><tr style="background-color:#def6fe;font-size:13px"><td><div style="'
        ,'font-weight:bold;width:395px;word-break:break-all;white-space:normal;padding-lef'
        ,'t:5px;padding-right:5px;padding-top:8px;padding-bottom:8px;word-break:break-all;'
        ,'color:#344449;margin-top:0;margin-bottom:0">/</div></td></tr></tbody></table></t'
        ,'d></tr><tr width="405px" style="color:#585858;font-size:13px"><td><table><tbody>'
        ,'<tr style="border-bottom:0;background-color:#fff;font-size:13px"><td><p style="w'
        ,'idth:395px;margin-left:5px;margin-right:5px;margin-bottom:2px;margin-top:5px;wor'
        ,'d-break:break-all;color:#333">姓名</p></td></tr><tr style="background-color:#def6f'
        ,'e;font-size:13px"><td><div style="font-weight:bold;width:395px;word-break:break-'
        ,'all;white-space:normal;padding-left:5px;padding-right:5px;padding-top:8px;paddin'
        ,'g-bottom:8px;word-break:break-all;color:#344449;margin-top:0;margin-bottom:0">王涛'
        ,'</div></td></tr></tbody></table></td></tr><tr width="405px" style="color:#585858'
        ,';font-size:13px"><td><table><tbody><tr style="border-bottom:0;background-color:#'
        ,'fff;font-size:13px"><td><p style="width:395px;margin-left:5px;margin-right:5px;m'
        ,'argin-bottom:2px;margin-top:5px;word-break:break-all;color:#333">Email</p></td><'
        ,'/tr><tr style="background-color:#def6fe;font-size:13px"><td><div style="font-wei'
        ,'ght:bold;width:395px;word-break:break-all;white-space:normal;padding-left:5px;pa'
        ,'dding-right:5px;padding-top:8px;padding-bottom:8px;word-break:break-all;color:#3'
        ,'44449;margin-top:0;margin-bottom:0"><a href="mailto:27109125@qq.com" target="_bl'
        ,'ank">27109125@qq.com</a></div></td></tr></tbody></table></td></tr><tr width="405'
        ,'px" style="color:#585858;font-size:13px"><td><table><tbody><tr style="border-bot'
        ,'tom:0;background-color:#fff;font-size:13px"><td><p style="width:395px;margin-lef'
        ,'t:5px;margin-right:5px;margin-bottom:2px;margin-top:5px;word-break:break-all;col'
        ,'or:#333">手机</p></td></tr><tr style="background-color:#def6fe;font-size:13px"><td'
        ,'><div style="font-weight:bold;width:395px;word-break:break-all;white-space:norma'
        ,'l;padding-left:5px;padding-right:5px;padding-top:8px;padding-bottom:8px;word-bre'
        ,'ak:break-all;color:#344449;margin-top:0;margin-bottom:0">13387488758</div></td><'
        ,'/tr></tbody></table></td></tr><tr width="405px" style="color:#585858;font-size:1'
        ,'3px"><td><table><tbody><tr style="border-bottom:0;background-color:#fff;font-siz'
        ,'e:13px"><td><p style="width:395px;margin-left:5px;margin-right:5px;margin-bottom'
        ,':2px;margin-top:5px;word-break:break-all;color:#333">如果我们投资你们，请列出所有会搬到（或已经在）<wbr'
        ,'>北京的创始<span class="il">人</span>姓名</p></td></tr><tr style="background-color:#def6'
        ,'fe;font-size:13px"><td><div style="font-weight:bold;width:395px;word-break:break'
        ,'-all;white-space:normal;padding-left:5px;padding-right:5px;padding-top:8px;paddi'
        ,'ng-bottom:8px;word-break:break-all;color:#344449;margin-top:0;margin-bottom:0">公'
        ,'司现已在国家级高新区，<wbr>享受国家级的互联网企业创业环境和补贴，<wbr>且在长沙拥有自己专业的技术团队、各种本土商业资源，<wbr>湖南广电媒体资源。所'
        ,'以公司主体核心团队并不会搬迁到北京，<wbr>但公司创始<span class="il">人</span>刘丰，现已在北京一年。主要负责公司外围资源对接。</d'
        ,'iv></td></tr></tbody></table></td></tr><tr width="405px" style="color:#585858;fo'
        ,'nt-size:13px"><td><table><tbody><tr style="border-bottom:0;background-color:#fff'
        ,';font-size:13px"><td><p style="width:395px;margin-left:5px;margin-right:5px;marg'
        ,'in-bottom:2px;margin-top:5px;word-break:break-all;color:#333">请告诉我们你们发现的很令<span class="il">人</span>惊奇的或者有趣的事情（<wbr>不一定要和这'
        ,'个项目相关）。</p></td></tr><tr style="background-color:#def6fe;font-size:13px"><td><di'
        ,'v style="font-weight:bold;width:395px;word-break:break-all;white-space:normal;pa'
        ,'dding-left:5px;padding-right:5px;padding-top:8px;padding-bottom:8px;word-break:b'
        ,'reak-all;color:#344449;margin-top:0;margin-bottom:0">1、在产品3.0的市场调研过程中，<wbr>800多份'
        ,'有效调查问卷里有524份调查问卷小孩子最想对老爸做<wbr>的事情选择了打老爸屁股，原因就是因为经常被老爸打屁股。<br>&nbsp;2、在产品3.0测试使用过'
        ,'程中，<wbr>有一个4岁的小朋友正常游戏赢了他爸爸（他爸爸并没有放水），<wbr>然后这个小朋友把这个事情津津乐道的讲给了身边认识的每一个<span clas'
        ,'s="il">人</span>听<wbr>，妈妈、爷爷奶奶、外公外婆。同龄<span class="il">人</span>。<br>&nbsp;&nbsp;这'
        ,'是我们一个有趣的发现，孩子除了天生具有好奇、探索、<wbr>冒险、对比的欲望<span class="il">之</span>外，<wbr>一些颠覆性的事情或者'
        ,'游戏能让他记忆深刻，并且乐于分享。</div></td></tr></tbody></table></td></tr></tbody></table></div'
        ,'></div>'

      ].join('')
      
      var message = {
        getBody: function () { return HTML }
        , getSubject: function () { return 'dummy subject' }
      }
      var thread = {
        getMessages: function () { return [message] }
      }
      var req = {
        getThread: function () { return thread }
        , getMessage: function () { return message }
      }
      var res = {}
      var next = function () {}
      
      Parser.mikeCrm2Table(req, res, next)
      
//      Logger.log(JSON.stringify(req.table))
      
      var EXPECTED_KEY = '创投平台项目地址'
      var EXPECTED_VAL = '暂时性没有在任何平台上登记'
      var EXPECTED_EMAIL = '27109125@qq.com'

      t.equal(req.table[EXPECTED_KEY], EXPECTED_VAL, 'mikecrm parse right')
      
      Parser.table2Apply(req, res, next)
      t.ok(req.table, 'apply load ok')
      t.equal(req.table.email, EXPECTED_EMAIL, 'apply email ok')
    })
         
    test('JsForm', function (t) {
      var HTML = [
        '<table ><tbody><tr><th>项目/产品叫什么（限10字）</th><td>极速学院</td></tr>'
        , '<tr><th>Email</th><td><a title="发送邮件到此邮箱" href="mailto:renjincheng@126.com" target="_blank">renjincheng@126.com</a></td></tr></tbody></table>'
      ].join('')
      
      var message = {
        getBody: function () { return HTML }
        , getSubject: function () { return 'dummy subject' }
      }
      var thread = {
        getMessages: function () { return [message] }
      }
      var req = {
        getThread: function () { return thread }
        , getMessage: function () { return message }
      }
      var res = {}
      var next = function (e) { if (e) throw Error(e) }
      
      Parser.jsForm2Table(req, res, next)
      
//      Logger.log(JSON.stringify(req.table))
      
      var EXPECTED_KEY = '项目/产品叫什么（限10字）'
      var EXPECTED_VAL = '极速学院'
      var EXPECTED_EMAIL = '<renjincheng@126.com>'
      t.ok(req.table, 'parse table ok')
      t.equal(req.table[EXPECTED_KEY], EXPECTED_VAL, 'jsform parse right')
      
      Parser.table2Bizplan(req, res, next)
//      Logger.log(JSON.stringify(req.bizplan))
      
      t.ok(req.bizplan, 'parse bizplan ok')
      t.equal(req.bizplan.from, EXPECTED_EMAIL, 'bizplan email ok')
      t.equal(req.bizplan.subject, EXPECTED_VAL, 'bizplan subject ok')
      
    })
         
    
    test('Intviu', function (t) {
      var HTML = [
        '<table align="center" cellpadding="0" cellspacing="0">'
        ,'<tbody>'
        ,'<tr>'
        ,'<td style="text-align:center;font-size:20px;font-weight:bold">'
        ,'<p>上传视频通知</p>'
        ,'</td>'
        ,'</tr>'
        ,'<tr>'
        ,'<td style="font-size:14px;border-bottom:1px solid #eeeeee">'
        ,'<p style="font-weight:bold">尊敬的 李卓桓，您好！</p>'
        ,''
        ,'<p>您的<span class="il">面试</span>邀请－ PA创始人，收到来自<span class="il">面试</span>者的录制视频，请点击进行查看：</p>'
        ,''
        ,'<table bgcolor="#FFF" cellpadding="10" cellspacing="1" style="color:#333333;font-size:14px;border-radius:5px" width="100%">'
        ,'<tbody>'
        ,'<tr>'
        ,'<td bgcolor="#f8f8f8" style="color:#666666"><span class="il">面试</span>名称：</td>'
        ,'<td bgcolor="#f8f8f8" style="color:#333333"><b>PreAngel申请项目视频介绍</b></td>'
        ,'</tr>'
        ,'<tr>'
        ,'<td bgcolor="#f8f8f8" style="color:#666666"><span class="il">面试</span>职位：</td>'
        ,'<td bgcolor="#f8f8f8" style="color:#333333"><b>PA创始人</b></td>'
        ,'</tr>'
        ,'<tr>'
        ,'<td bgcolor="#f8f8f8" style="color:#666666"><span class="il">面试</span>者：</td>'
        ,'<td bgcolor="#f8f8f8" style="color:#333333"><b>陈旻</b></td>'
        ,'</tr>'
        ,'<tr>'
        ,'<td bgcolor="#f8f8f8" style="color:#666666"><span class="il">面试</span>者手机：</td>'
        ,'<td bgcolor="#f8f8f8" style="color:#333333"><b>15340002848</b></td>'
        ,'</tr>'
        ,'<tr> \n'
        ,' <td bgcolor="#f8f8f8" style="color:#666666"><span class="il">面试</span>邮箱：</td>\n'
        ,' <td bgcolor="#f8f8f8" style="color:#333333"><b><a href="mailto:123418697@qq.com" target="_blank">123418697@qq.com</a></b></td> \n'
        ,'</tr> \n'
        ,'<tr>'
        ,'<td bgcolor="#f8f8f8" style="color:#666666">视频上传时间：</td>'
        ,'<td bgcolor="#f8f8f8" style="color:#333333"><b>2016-01-06 11:06:25</b></td>'
        ,'</tr>'
        ,'</tbody>'
        ,'</table>'
        ,''
        ,'<div style="background-color:#e8645a;width:180px;text-align:center;padding:12px;margin:20px auto;border:1px #ffffff solid;font-size:12px;border-radius:5%">'
        ,'<span><a href="http://sctrack.www.intviu.cn/track/click/eyJ1c2VyX2lkIjogMzkwOTcsICJ0YXNrX2lkIjogIiIsICJlbWFpbF9pZCI6ICIxNDUyMDQ5NTg1ODUzXzM5MDk3XzEyNDI5Xzk'
        ,'4MTUuc2MtMTBfMTBfMjRfMTU1LWluYm91bmQwJHppeGlhQHppeGlhLm5ldCIsICJzaWduIjogImEwNjliOWIwMDUzOWQ3OTcwN2ZhMGQ0YWEwYmVlZDU4IiwgInVzZXJfaGVhZGVycyI6IHt9LCAibGFiZW'
        ,'wiOiAwLCAibGluayI6ICJodHRwcyUzQS8vaW50dml1LmNuL3YzL2ludGVydmlldy92aWV3JTNGY2FuZGlkYXRlX2ludGVydmlld19pZCUzRDU2OGM4MGJjNWM0MjgiLCAiY2F0ZWdvcnlfaWQiOiA4Mjg0O'
        ,'X0=.html" style="color:#ffffff;text-decoration:none;font-size:14px" target="_blank">查看<span class="il">面试</span>视频</a> </span></div>'
        ,''
        ,'<p style="font-size:14px;text-align:center;width:100%">您也复制并粘贴下面链接，到浏览器的地址栏中访问：<br>'
        ,'<a href="http://sctrack.www.intviu.cn/track/click/eyJ1c2VyX2lkIjogMzkwOTcsICJ0YXNrX2lkIjogIiIsICJlbWFpbF9pZCI6ICIxNDUyMDQ5NTg1ODUzXzM5MDk3XzEyNDI5Xzk4MTUuc2M'
        ,'tMTBfMTBfMjRfMTU1LWluYm91bmQwJHppeGlhQHppeGlhLm5ldCIsICJzaWduIjogImEwNjliOWIwMDUzOWQ3OTcwN2ZhMGQ0YWEwYmVlZDU4IiwgInVzZXJfaGVhZGVycyI6IHt9LCAibGFiZWwiOiAwLCAi'
        ,'bGluayI6ICJodHRwcyUzQS8vaW50dml1LmNuL3YzL2ludGVydmlldy92aWV3JTNGY2FuZGlkYXRlX2ludGVydmlld19pZCUzRDU2OGM4MGJjNWM0MjgiLCAiY2F0ZWdvcnlfaWQiOiA4Mjg0OX0=.html" st'
        ,'yle="color:#27b3c5" target="_blank">https://intviu.cn/v3/<wbr>interview/view?candidate_<wbr>interview_id=568c80bc5c428</a></p>'
        ,'</td>'
        ,'</tr>'
        ,'</tbody>'
        ,'</table>'
      ].join('')
      
      var message = {
        getBody: function () { return HTML }
        , getSubject: function () { return 'dummy subject' }
      }
      var thread = {
        getMessages: function () { return [message] }
      }
      var req = {
        getThread: function () { return thread }
        , getMessage: function () { return message }
      }
      var res = {}
      var next = function (e) { if (e) throw Error(e) }
      
      Parser.intviu2Table(req, res, next)
      
//      Logger.log(JSON.stringify(req.table))
      
      var EXPECTED_KEY = '面试邮箱：'
      var EXPECTED_VAL = '123418697@qq.com'
      var EXPECTED_EMAIL = '123418697@qq.com'
      t.ok(req.table, 'parse table ok')
      t.equal(req.table[EXPECTED_KEY], EXPECTED_VAL, 'intviu parse right')
      
      Parser.table2Interview(req, res, next)
//      Logger.log(JSON.stringify(req.interview))
      
      t.ok(req.table, 'parse interview ok')
      t.equal(req.table.email, EXPECTED_EMAIL, 'interview email ok')
    })
  }
  
  function testGasContact() {
    test('GasContact', function (t) {
      var LIST = [ 0,1,2,3,4,5,6,7,8,9 ]
      var EXIST_VALUE = 7
      var EXPECTED_EXIST_INDEX = 7
      
      var index = GasContact.binary(LIST, EXIST_VALUE)
      t.equal(index, EXPECTED_EXIST_INDEX, 'binary search for exist value')
      
      var NOEXIST_VALUE=99
      var EXPECTED_NOEXIST_INDEX = -1
      index = GasContact.binary(LIST, NOEXIST_VALUE)
      t.equal(index, EXPECTED_NOEXIST_INDEX, 'binary search for no exist value')
    })
    
    test('GasContact', function (t) {
      ///////////////////////////////////////////////////////////////
      var MY_CONTACT_EMAIL = 'zixia@zixia.net'
      var NOT_MY_CONTACT_EMAIL = 'fasdfaas.com.xx'
      var c = new GasContact()
      var isExist = c.isMyContact(MY_CONTACT_EMAIL)
      t.ok(isExist, 'isMyContact return exist')
      
      var isNotExist = (false===c.isMyContact(NOT_MY_CONTACT_EMAIL))
      t.ok(isNotExist, 'isMyContact return not exist')
      
      var FROM = '腾讯企业邮箱 <10000@qq.com>'
      var EXPECTED_EMAIL = '10000@qq.com'
      var email = GasContact.getEmailAddress(FROM)
      t.equal(email, EXPECTED_EMAIL, 'extract email address')
      

      var FROM = '"qsw@qushuawang.com" <qsw@qushuawang.com>'
      var EXPECTED_EMAIL = 'qsw@qushuawang.com'
      var email = GasContact.getEmailAddress(FROM)
      t.equal(email, EXPECTED_EMAIL, 'extract email address with quota')
      ///////////////////////////////////////////////////////////////
    })
    
    test('GasContact', function (t) {
      var BEIJING_MOBILE = '13911833788'
      var UNKNOWN_MOBILE = '99999999999'
      
      var isBeijing = GasContact.isBeijingMobile(BEIJING_MOBILE)
      t.ok(isBeijing, 'beijing mobile')
      
      var isNotBeijing = !GasContact.isBeijingMobile(UNKNOWN_MOBILE)
      t.ok(isNotBeijing, 'unknown mobile')
    })
  }
}