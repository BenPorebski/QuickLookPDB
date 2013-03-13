//
//  common.h
//  ql_jolecule
//
//  Created by Ben Porebski on 17/02/13.
//  Copyright (c) 2013 __MyCompanyName__. All rights reserved.
//

#ifndef ql_jolecule_common_h
#define ql_jolecule_common_h

#include <CoreFoundation/CoreFoundation.h>
#include <CoreFoundation/CFPlugInCOM.h>
#include <CoreServices/CoreServices.h>
#include <QuickLook/QuickLook.h>


// Local includes

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <time.h>
#include <sys/sysctl.h>
#include <mach/host_info.h>
#include <mach/mach_host.h>
#include <mach/task_info.h>
#include <mach/task.h>


struct metaData {
	
	char Header[1024];
	char Title[1024];
	char Keywds[4000];
	char Expdata[1024];
	char JrnlAuthor[4000];
	char JrnlTitle[1024];
	char JrnlRef[1024];
	char Resolution[1024];
	
};

void calcRectangle(const char *Attribute, char *Data, int rowLength, int colLength, int wraplength, int * textposX, int * textposY);

void drawMetaDataText (CGContextRef myContext, CGRect contextRect, CFURLRef url);
void DrawText (const char *Attribute, char *Data, CGContextRef myContext,
			   int rowLength, int colLength, int wraplength, int * textposX, int * textposY);
void exportMetaData(CFURLRef url, struct metaData *mtData);
void findErase(char *Str, char replaceChr);
void eraseDoubleSpaces(char *Str);
void cleanupString(char *Str);
void wordWrap(char *inputStr, char *outputArray, int colLength, int maxlen);


void drawRoundedRect(CGContextRef context, int x, int y);

void findReplace(char *Str, char *find, char *replace);

double getFreeMemory(void);

#endif
